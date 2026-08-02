import json,sys
def rb(p): return open(p,encoding="utf-8").read().strip()
def r(p): return open(p,encoding="utf-8").read()
def P(folder,name,val,w,file): return {"name":name,"val":val,"w":w,"b64":rb(f"sku/{folder}/{file}.b64")}
def icon(folder): 
    import base64,os
    b=base64.b64encode(open(f"sku/{folder}/icon.png","rb").read()).decode(); return b
SKUS={
 "energy":{"en":"ENERGY","he":"אנרגיה טבעית למיקוד וחיוניות","tag":"אנרגיה טבעית למיקוד וחיוניות",
   "accent":"#D8703F","accent2":"#E7A05E","total":800,"icon":icon("energy"),"pouch":rb("warm/POUCH.b64"),
   "powders":[P("energy","רודיאלה",660,280,"rodiola"),P("energy","תה ירוק",80,255,"greentea"),
     P("energy","קינמון",40,255,"cinnamon"),P("energy","ליקוריץ",13,255,"licorice"),P("energy","גוארנה",7,255,"guarana")]},
 "relax":{"en":"RELAX","he":"הרגעה טבעית לאיזון ורוגע","tag":"הרגעה טבעית לאיזון ורוגע",
   "accent":"#6E8148","accent2":"#9DB06A","total":700,"icon":icon("relax"),"pouch":"",
   "powders":[P("relax","מליסה",266,265,"melissa"),P("relax","פסיפלורה",182,255,"passiflora"),
     P("relax","מאקה",140,255,"maca"),P("relax","ולריאן",70,255,"valerian"),P("relax","ליקוריץ",42,255,"licorice")]},
 "sleep":{"en":"SLEEP","he":"שינה טבעית עמוקה ומרגיעה","tag":"שינה טבעית עמוקה ומרגיעה",
   "accent":"#536588","accent2":"#8AA0C2","total":728,"icon":icon("sleep"),"pouch":"",
   "powders":[P("sleep","מליסה",224,260,"melissa"),P("sleep","פסיפלורה",224,255,"passiflora"),
     P("sleep","ולריאן",224,255,"valerian"),P("sleep","ליקוריץ",56,255,"licorice")]},
}
sku=sys.argv[1]
# ensure icon b64 files exist as .b64 too (icon() reads png directly)
html=r("sku.template.html").replace("__HEEBO_LAT__",rb("heebo_lat.txt")).replace("__HEEBO_HE__",rb("heebo_he.txt"))
html=html.replace("__SKUJSON__",json.dumps(SKUS[sku],ensure_ascii=False))
open(f"sku_{sku}.html","w",encoding="utf-8").write(html)
print("built sku_"+sku,len(html)//1024,"KB")
