import re,glob,json
from content_keys import content_keys
files=[f for f in glob.glob('src/components/**/*.tsx',recursive=True)+glob.glob('src/pages/**/*.tsx',recursive=True)+glob.glob('src/hooks/*.ts')+glob.glob('src/data/*.ts')+glob.glob('src/lib/*.ts') if '.test.' not in f and '/ui/' not in f]
skip_files={'src/data/categoryStyleArtwork.ts','src/data/saintOnlinePortraits.ts','src/data/saintFacePortraitUpdates.ts','src/data/saintCardIcons.ts','src/data/historicalIslandImages.ts','src/data/saintDisplayIcons.ts'}
S=set();big=set()
for f in files:
  if f in skip_files: continue
  src=open(f).read()
  data = f.startswith('src/data')
  for m in re.finditer(r'[>}]([^<>{}]*[A-Za-z][^<>{}]*)[<{]',src):
    t=' '.join(m.group(1).split())
    if t and not re.search(r'[=;]|=>|&&',t): S.add(t)
  for m in re.finditer(r'(?<![\w.])(["\'`])((?:(?!\1)[^\\\n]|\\.)*)\1',src):
    t=m.group(2)
    if '${' in t: continue
    if not re.search(r'[A-Za-z]{2}',t): continue
    if re.fullmatch(r'[\w\-./:@#]+',t) and not re.match(r'^[A-Z][a-z]',t): continue
    if re.search(r'^(https?:|/|\.|@/|[a-z\-]+:)|\b(bg|text|flex|px|py|rounded|border|w|h)-\w',t): continue
    t=t.replace("\\'","'").replace('\\"','"')
    (big if len(t)>200 else S).add(t)
for text in content_keys():
  (big if len(text)>200 else S).add(text)
json.dump(sorted(S),open('/tmp/i18n/short.json','w'),ensure_ascii=False)
json.dump(sorted(big),open('/tmp/i18n/long.json','w'),ensure_ascii=False)
print(len(S),sum(map(len,S)),len(big),sum(map(len,big)))
