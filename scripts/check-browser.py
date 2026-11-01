#!/usr/bin/env python3
"""Exercise the public site at its Pages subpath. Requires Playwright and Chromium."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',default='http://127.0.0.1:4178/inferno-investigated/');p.add_argument('--captures',type=Path);args=p.parse_args()
if args.captures:args.captures.mkdir(parents=True,exist_ok=True)
errors=[];counts={}
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:errors.append(f'{r.status} {r.url}') if r.status>=400 else None)
 def go(route):page.goto(args.url+route,wait_until='networkidle');page.wait_for_timeout(200)
 def capture(name,element):
  if args.captures:
   page.locator(element).evaluate('(c)=>{c.style.width="1200px";c.style.height="750px";}');page.wait_for_timeout(250)
   page.locator(element).screenshot(path=str(args.captures/(name+'.jpg')),type='jpeg',quality=92)
 go('models/');counts['models']=page.locator('#model option').count();assert counts['models']==1691
 page.uncheck('#jitter');page.wait_for_timeout(100);assert not page.locator('#status').inner_text();page.evaluate('zoom=1.7;dirty=true');page.wait_for_timeout(100);capture('models','#preview')
 page.select_option('#model','adcd05a9');page.wait_for_timeout(100);before=page.locator('#preview').evaluate('(c)=>c.toDataURL()');page.fill('#state-value','20');page.locator('#state-value').dispatch_event('change');page.wait_for_timeout(100);assert before!=page.locator('#preview').evaluate('(c)=>c.toDataURL()')
 page.locator('#play').click();page.wait_for_timeout(300);assert not page.locator('#status').inner_text()
 page.fill('#search','rex_bug');assert page.locator('#model option').count()==3
 page.fill('#search','');page.locator('#next').click();assert page.locator('#page').inner_text().startswith('2 /')
 page.locator('a[href="#epicship"]').click();page.wait_for_function('document.querySelector("#title").textContent.includes("epicship")')
 # All generated presets must remain visible at the actual main-view scale.
 invisible=page.evaluate("""() => all.filter(m=>!m.preview.empty).filter(m=>{
  const p=m.preview;
  return !geometry(m,{...p,frame:p.frame,parameters:InfernoPreview.parameters(p.parameters),project:InfernoPreview.project(p.yaw,p.pitch)}).primitives.length;
 }).map(m=>m.name)""")
 assert not invisible,invisible
 assert page.evaluate('paletteKey(active)')=='justsun1'
 assert page.locator('footer a[href="https://github.com/Lost-Engines/inferno-reverse"]').inner_text()=='Inferno analysis'
 assert not page.locator('footer a[href*="tfx"]').count()
 def choose_model(name):
  page.evaluate('(name)=>select(all.find(m=>m.name===name))',name);page.wait_for_timeout(100)
  assert name in page.locator('#title').inner_text()
 for name,palette in [('planet1','intro_p1'),('planet7','intro_p1'),('pss1_s','p1ss'),('epicship','justsun1')]:
  choose_model(name);assert page.evaluate('paletteKey(active)')==palette
 page.select_option('#palette','justsun1');choose_model('planet1');assert page.evaluate('paletteKey(active)')=='justsun1'
 page.select_option('#palette','')
 choose_model('astblow1');assert not page.locator('#status').inner_text()
 assert page.evaluate('parameters[0]>0&&parameters[1]>0&&parameters[7]===0')
 page.locator('#zero-states').click();page.wait_for_timeout(100);assert 'Nothing is drawn' in page.locator('#status').inner_text()
 page.locator('#restore-preview').click();page.wait_for_timeout(100);assert not page.locator('#status').inner_text()
 page.fill('#search','astblow1');assert page.locator('.model-badge').inner_text()=='Animation'
 for name,label in [('introast','Drawing disabled'),('kelp1','Drawing disabled'),('offsut','Vertices only'),('test1','Vertices only')]:
  page.fill('#search',name);assert page.locator(f'[data-model="{name}"] .empty-preview').inner_text()==label
 page.fill('#search','')
 for name in ['fcorarm1','uflight','astring1','outline2']:
  choose_model(name);assert not page.locator('#status').inner_text()
  page.locator('#reset').click();page.wait_for_timeout(100);assert not page.locator('#status').inner_text()
 # A drag to the right turns the model with the mouse; vertical direction is unchanged.
 choose_model('epicship');page.locator('#preview').scroll_into_view_if_needed()
 rect=page.locator('#preview').bounding_box();start=page.evaluate('[yaw,pitch]')
 x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+50,y+25,steps=4);page.mouse.up()
 end=page.evaluate('[yaw,pitch]');assert end[0]>start[0] and end[1]>start[1]
 counts['visible_model_presets']=page.evaluate('all.filter(m=>!m.preview.empty).length')
 # Groups combine with search, carry into shared URLs and never strand a link.
 group_counts=page.evaluate('Object.fromEntries(categories.map(c=>[c.id,c.count]))')
 for category,total in group_counts.items():
  page.select_option('#category',category)
  assert page.locator('#model option').count()==total,(category,total)
  assert page.evaluate('filtered.includes(active)&&active.categories.includes($("category").value)')
  assert 'category='+category in page.url
 page.select_option('#category','cockpit');page.fill('#search','bollocks')
 assert page.locator('#model option').count()==1
 assert '13 polygons' in page.locator('#usage-note').inner_text()
 page.locator('#related-models a').filter(has_text='epiccok2').click()
 page.wait_for_function('active.name==="epiccok2"');assert page.locator('#search').input_value()==''
 assert page.locator('#category').input_value()=='cockpit'
 page.locator('a[href="#epicship"]').click();page.wait_for_function('active.name==="epicship"')
 assert page.locator('#category').input_value()==''
 assert page.locator('#model option').count()==1691
 page.select_option('#category','craft');page.fill('#search','no-such-inferno-model')
 assert page.locator('#model').is_disabled() and page.locator('#model option').count()==0
 assert 'No models match' in page.locator('#gallery').inner_text()
 page.fill('#search','');page.select_option('#category','')
 go('models/?category=cockpit#bollocks')
 assert page.locator('#category').input_value()=='cockpit' and page.evaluate('active.name')=='bollocks'
 page.select_option('#category','');page.fill('#search','fart')
 choose_model('fart');assert page.locator('#notes').inner_text()=='0 surfaces · 0 lines · 36 points'
 def covered(selector):
  return page.locator(selector).evaluate("""c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let n=0;for(let i=0;i<p.length;i+=4)if(p[i]!==16||p[i+1]!==23||p[i+2]!==33)n++;return n;}""")
 assert covered('#preview')>36*4,'World-sized spheres collapsed to single pixels'
 page.locator('[data-model="fart"] canvas').scroll_into_view_if_needed();page.wait_for_timeout(100)
 assert covered('[data-model="fart"] canvas')>36*3,'Sphere thumbnail is too small'
 counts['model_categories']=len(group_counts)
 counts['fart_visible_pixels']=covered('#preview')
 page.fill('#search','')

 # Moving geometry must remain visible as pixels, not merely as counted faces.
 choose_model('tera1');assert page.locator('#state-value').get_attribute('max')=='71'
 assert page.locator('#animation-view').input_value()=='follow'
 coverage=page.evaluate("""async () => {
  const counts=[];
  for(let value=0;value<72;value++){
   setState(value);
   await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
   const c=$('preview'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
   let covered=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]!==16||pixels[i+1]!==23||pixels[i+2]!==33)covered++;
   counts.push(covered);
  }
  return counts;
 }""")
 assert min(coverage)>1000,coverage
 counts['tera1_visible_animation_states']=len(coverage)
 page.select_option('#animation-view','path');assert page.evaluate('bounds.radius')>10000
 page.select_option('#animation-view','follow');assert page.evaluate('bounds.radius')<1000
 page.evaluate('setState(70)');page.check('#loop');page.fill('#speed','30');page.locator('#play').click()
 page.wait_for_function('parameters[0]<10&&direction===1',timeout=1500);page.evaluate('stop()')
 page.select_option('#state','7');assert page.locator('#state-toggle').is_visible() and page.locator('#play').is_hidden()
 page.check('#state-toggle');page.wait_for_function('document.querySelector("#status").textContent==="Hidden by parameter 7."')
 page.uncheck('#state-toggle');page.wait_for_function('!document.querySelector("#status").textContent')
 go('maps/');counts['worlds']=page.locator('#environment option').count();assert counts['worlds']==31;assert '29, 150' in page.locator('#cell-title').inner_text();assert not page.locator('#status').inner_text();capture('worlds','#scene')
 page.locator('a[href="#corr01/14/174"]').click();page.wait_for_function('document.querySelector("#cell-title").textContent.includes("14, 174")');page.check('#corridors');page.check('#cutaway');assert not page.locator('#status').inner_text()
 page.select_option('#environment','space1');assert '80, 78' in page.locator('#cell-title').inner_text()
 page.select_option('#environment','planet2');page.select_option('#reference','4');assert '102, 151' in page.locator('#cell-title').inner_text()
 go('corridors/');counts['profiles']=page.locator('#profile option').count();assert counts['profiles']==64;assert not page.locator('#status').inner_text();capture('corridors','#scene')
 page.select_option('#profile','52');page.locator('#nodes button').first.click();assert 'Inside' in page.locator('#result').inner_text();page.check('#surfaces');page.check('#cutaway');assert not page.locator('#status').inner_text()
 for route in ['', 'story/', 'artwork/', 'sound/', 'about/']:
  go(route)
  if route=='sound/':
   page.locator('[data-sound="sc55"]').click();page.wait_for_function('document.querySelector("#comparison").readyState>=1');assert 'SC-55' in page.locator('#sound-label').inner_text();assert 17.8<page.locator('#comparison').evaluate('(a)=>a.duration')<18.2
 page.set_viewport_size({'width':390,'height':844})
 for route in ['', 'models/', 'maps/', 'corridors/', 'story/', 'artwork/', 'sound/', 'about/']:
  go(route);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'Mobile overflow: {route}'
  page.locator('[data-menu]').click();assert page.locator('#navigation').is_visible();page.locator('[data-menu]').click()
 if args.captures:
  go('');page.screenshot(path=str(args.captures/'mobile-home.png'),full_page=True)
 browser.close()
assert not errors,errors
print(json.dumps({'passed':True,'counts':counts,'viewports':['1440x1000','390x844'],'errors':errors},indent=2))
