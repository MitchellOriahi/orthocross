"""Extract rendered History and Saints strings, never Bible content."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
def content_keys():
    keys=set()
    def add(s):
        if s.strip(): keys.add(' '.join(s.split()))
    roster=json.loads((ROOT/'src/data/saintPageRoster.json').read_text())
    for s in roster:
        for f in ('name','prefix','subtitle'): add(s[f])
        add(' '.join(filter(None,[s['prefix'],s['name']])))
        for m in s['memberships']: add(m['subgroup'])
    for v in json.loads((ROOT/'src/data/saintStories.json').read_text()).values():
        for p in v: add(p)
    src=(ROOT/'src/data/historyContent.ts').read_text()
    for field,escaped in re.findall(r'\b(displayName|fullSetTitle|title|reading|question|awardPiece): "((?:[^"\\]|\\.)*)"',src):
        v=json.loads('"'+escaped+'"')
        if field=='reading':
            for p in re.split(r'\n\n+',v):
                for sentence in re.split(r'(?<=[.!?])\s+',p): add(sentence)
        elif field=='awardPiece': add(v.replace('_',' '))
        else:
            add(v)
            if field=='title': add(re.sub(r'\s*\([^)]+\)','',v).strip())
    for v in re.findall(r'\boptions: (\[[^\n]+\])',src):
        for option in json.loads(v): add(option)
    oriental=(ROOT/'src/components/resources/OrientalEtiquette.tsx').read_text()
    for escaped in re.findall(r'"((?:[^"\\]|\\.)*)"',oriental):
        v=json.loads('"'+escaped+'"')
        if v[:1].isupper() and not re.search(r'[@/]|(?:text|bg|space|grid|flex|border|rounded)-',v): add(v); add('• '+v)
    for name in re.findall(r'\bname: "([^"]+)"',oriental): add(name+' Orthodox')
    return sorted(keys)
if __name__=='__main__': print(json.dumps(content_keys(),ensure_ascii=False))
