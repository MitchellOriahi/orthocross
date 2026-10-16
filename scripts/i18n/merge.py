import json,glob,os,re
bible=open('/dev-server/src/data/bibleContent.ts').read()
os.makedirs('/dev-server/public/i18n',exist_ok=True)
for lang in ["am","ar","hy","bg","fr","ka","el","he","ml","pt","ro","ru","sr","es","ti","uk"]:
  d={}
  for f in glob.glob(f'/tmp/i18n/out*/{lang}_*.json'): d.update(json.load(open(f)))
  d={k:v for k,v in d.items() if not (len(k)>40 and k in bible)}
  json.dump(d,open(f'/dev-server/public/i18n/{lang}.json','w'),ensure_ascii=False,separators=(',',':'))
  print(lang,len(d))
