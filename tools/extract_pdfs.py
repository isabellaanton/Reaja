#!/usr/bin/env python3
"""
Extrai o texto dos PDFs oficiais da Sedec/MIDR e gera data/content.js
(seções Antes / Durante / Depois, mais Recomendações gerais e "Não faça" quando existirem).

Requisitos: Python 3 e `pdftotext` (pacote poppler-utils).
  macOS: brew install poppler   |   Ubuntu: sudo apt install poppler-utils

Uso:
  python3 tools/extract_pdfs.py                      # baixa todos os PDFs de data/disasters.js
  python3 tools/extract_pdfs.py --slug granizo       # só um tema
  python3 tools/extract_pdfs.py --dir ~/Downloads    # usa PDFs já baixados (nome = campo `pdf`)
  python3 tools/extract_pdfs.py --check              # só testa se os links dos PDFs respondem

O texto é copiado SEM edição (só quebras de linha e marcadores são normalizados).
REVISE o resultado e confirme a licença antes de publicar: os PDFs são CC BY-ND 3.0 e o README do
projeto prevê pedir autorização formal ao MIDR para adaptar/reformatar o conteúdo.
"""
import argparse, json, re, subprocess, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil/"
CACHE = ROOT / "tools" / ".pdf-cache"

HEAD = re.compile(
    r"^(?:como agir |o que fazer |medidas )?(?P<k>antes|durante|depois)(?:\s+(?:d[aeo]s?|em caso d[aeo]s?)\s+.{0,40})?\s*[:?]?$", re.I)
GENERAL = re.compile(r"^(recomenda[çc][õo]es gerais|orienta[çc][õo]es gerais|geral)\s*:?$", re.I)
AVOID = re.compile(r"^(n[ãa]o fa[çc]a|o que n[ãa]o fazer|evite)\s*:?$", re.I)
BULLET = re.compile(r"^\s*(?:[\uf000-\uf8ff•●▪■◦·\-–—*]|o(?=\s)|\d{1,2}[.)])\s+")
NOISE = re.compile(r"^(p[áa]gina\s*\d+|\d+|saiba como agir.*|secretaria nacional.*|a informa[çc][ãa]o [ée] a melhor.*|\f)$", re.I)


def load_disasters():
    src = (ROOT / "data" / "disasters.js").read_text(encoding="utf-8")
    return re.findall(r"slug:'([^']+)'.*?pdf:'([^']+)'", src)


def url_for(pdf):
    from urllib.parse import quote
    return pdf if pdf.startswith("http") else BASE + quote(pdf)


def fetch(pdf, folder):
    if folder and (Path(folder).expanduser() / pdf).exists():
        return (Path(folder).expanduser() / pdf).read_bytes()
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / pdf
    if cached.exists():
        return cached.read_bytes()
    req = urllib.request.Request(url_for(pdf), headers={"User-Agent": "Mozilla/5.0 (Reaja content extractor)"})
    data = urllib.request.urlopen(req, timeout=40).read()
    cached.write_bytes(data)
    return data


def pdf_text(data):
    p = subprocess.run(["pdftotext", "-enc", "UTF-8", "-", "-"], input=data, capture_output=True)
    if p.returncode:
        raise RuntimeError(p.stderr.decode("utf-8", "ignore"))
    return p.stdout.decode("utf-8", "ignore")


def parse(text):
    sections, cur, items, buf = {}, None, [], None
    order = []

    def flush():
        nonlocal buf
        if buf and cur:
            sections.setdefault(cur, []).append(re.sub(r"\s+", " ", buf).strip())
        buf = None

    lines = [l.strip() for l in text.replace("\r", "").split("\n")]
    has_bullets = {}
    key = None
    for l in lines:  # pré-passo: a seção usa marcadores?
        if not l:
            continue
        k = classify(l)
        if k:
            key = k
            has_bullets.setdefault(key, False)
        elif key and BULLET.match(l):
            has_bullets[key] = True

    for l in lines:
        if not l or NOISE.match(l):
            if not l and cur and not has_bullets.get(cur) and buf:
                flush()
            continue
        k = classify(l)
        if k:
            flush()
            cur = k
            if k not in order:
                order.append(k)
            continue
        if not cur:
            continue
        if BULLET.match(l):
            flush()
            buf = BULLET.sub("", l, count=1)
        elif buf is None:
            buf = l
        elif not has_bullets.get(cur) and re.search(r"[.;:!?]$", buf):
            flush()
            buf = l
        else:
            buf += " " + l
    flush()
    return sections


def classify(line):
    m = HEAD.match(line)
    if m:
        return m.group("k").lower().replace("antes", "before").replace("durante", "during").replace("depois", "after")
    if GENERAL.match(line):
        return "general"
    if AVOID.match(line):
        return "avoid"
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--slug"); ap.add_argument("--dir"); ap.add_argument("--check", action="store_true")
    ap.add_argument("--out", default=str(ROOT / "data" / "content.js"))
    a = ap.parse_args()
    todo = [(s, p) for s, p in load_disasters() if not a.slug or s == a.slug]
    content, report = {}, []
    for slug, pdf in todo:
        try:
            if a.check:
                req = urllib.request.Request(url_for(pdf), method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
                print(f"{urllib.request.urlopen(req, timeout=30).status}  {slug}  {url_for(pdf)}"); continue
            sec = parse(pdf_text(fetch(pdf, a.dir)))
        except urllib.error.HTTPError as e:
            report.append((slug, f"HTTP {e.code} — confira o nome do arquivo/URL: {url_for(pdf)}")); continue
        except Exception as e:
            report.append((slug, f"erro: {e}")); continue
        if not any(sec.get(k) for k in ("before", "during", "after")):
            report.append((slug, "não encontrei Antes/Durante/Depois — preencha manualmente")); continue
        content[slug] = {"pt": {k: v for k, v in sec.items() if v}}
        n = {k: len(v) for k, v in sec.items()}
        report.append((slug, f"ok {n}"))
    if a.check:
        return
    if a.slug and Path(a.out).exists():  # preserva os outros temas ao atualizar um só
        old = Path(a.out).read_text(encoding="utf-8")
        m = re.search(r"window\.REAJA_CONTENT\s*=\s*(\{.*\});?\s*$", old, re.S)
        if m:
            try: content = {**json.loads(m.group(1)), **content}
            except ValueError: pass
    head = "/* GERADO por tools/extract_pdfs.py — revise antes de publicar. Fonte: Sedec/MIDR (CC BY-ND 3.0). */\n"
    Path(a.out).write_text(head + "window.REAJA_CONTENT = " + json.dumps(content, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    for slug, msg in report:
        print(f"{slug:32} {msg}")
    print(f"\n{len(content)}/{len(todo)} temas gravados em {a.out}")


if __name__ == "__main__":
    sys.exit(main())
