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
