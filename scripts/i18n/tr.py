import json,os,sys,requests,time,concurrent.futures as cf
LANGS={"am":"Amharic","ar":"Arabic","hy":"Armenian (Eastern)","bg":"Bulgarian","fr":"French","ka":"Georgian","el":"Modern Greek","he":"Hebrew","ml":"Malayalam","pt":"Portuguese","ro":"Romanian","ru":"Russian","sr":"Serbian (Cyrillic script)","es":"Spanish","ti":"Tigrinya","uk":"Ukrainian"}
keys=json.load(open('/tmp/i18n/keys.json'))
chunks=[];cur=[];n=0
for k in keys:
  if cur and (n+len(k)>5000 or len(cur)>=60): chunks.append(cur);cur=[];n=0
  cur.append(k);n+=len(k)
chunks.append(cur)
os.makedirs('/tmp/i18n/out',exist_ok=True)
SYS=("You translate the interface and content of OrthoCross, an Orthodox Christian prayer, scripture and church app, into {L}. "
"Use the established Orthodox ecclesiastical vocabulary of that language's Orthodox Church (saints' names, feasts, Theotokos, liturgical terms, prayers as traditionally worded in that church). "
"Keep brand name OrthoCross unchanged. Preserve punctuation, emoji, numbers, placeholders like {{x}} and leading/trailing symbols. Short UI labels stay short. "
"Return JSON {{\"t\":[...]}} with exactly one translation per input string, same order.")
def job(lang,i):
  p=f'/tmp/i18n/out/{lang}_{i}.json'
  if os.path.exists(p): return
  src=chunks[i]
  for a in range(5):
    try:
      r=requests.post('https://ai.gateway.lovable.dev/v1/chat/completions',headers={'Authorization':'Bearer '+os.environ['LOVABLE_API_KEY']},
        json={"model":"openai/gpt-6-astra","reasoning_effort":"low","response_format":{"type":"json_schema","json_schema":{"name":"tr","strict":True,"schema":{"type":"object","properties":{"t":{"type":"array","items":{"type":"string"}}},"required":["t"],"additionalProperties":False}}},"messages":[{"role":"system","content":SYS.format(L=LANGS[lang])},{"role":"user","content":json.dumps(src,ensure_ascii=False)}]},timeout=240)
      if r.status_code in (402,403): print('STOP',r.status_code,r.text[:200],flush=True); os._exit(1)
      if r.status_code!=200: time.sleep(5*(a+1)); continue
      t=json.loads(r.json()['choices'][0]['message']['content'])['t']
      if len(t)!=len(src) or not all(isinstance(x,str) and x.strip() for x in t): continue
      json.dump(dict(zip(src,t)),open(p,'w'),ensure_ascii=False); return
    except Exception as e: time.sleep(5)
  print('FAIL',lang,i,flush=True)
langs=sys.argv[1].split(',') if len(sys.argv)>1 else list(LANGS)
print(len(chunks),'chunks',flush=True)
with cf.ThreadPoolExecutor(24) as ex:
  list(ex.map(lambda a: job(*a), [(l,i) for i in range(len(chunks)) for l in langs]))
print('DONE',flush=True)
