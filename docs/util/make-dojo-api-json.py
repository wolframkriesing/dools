#!/usr/bin/python
# how is the following done right? its not __docstring__ i am pretty sure (and to lazy to look it up :-( )
__docstring__ = """
This will generate the *.json file's content as you should find them in dools/docs/widget/resources/*.json.
Therefore it reads the directory structure and creates the according JSON structure.
To store it into a file just pipe the output there, like this:
    ./make-dojo-api-json.py directory/dools/ > doolsApi.json

Usage:
    Generate the API tree using the last directory name (here "dools") to be used as the root namespace.
       ./make-dojo-api-json.py directory/dools/
    OR
    Use the root namespace "myDools" instead.
       ./make-dojo-api-json.py directory/dools myDools
"""   

import sys
import os

if len(sys.argv)==1:
    print __docstring__
    sys.exit()

root = os.path.realpath(sys.argv[1])
if len(sys.argv)>2:
    rootname = sys.argv[2]
else:
    rootname = root.split(os.path.sep)[-1]
skip_dirs = ["templates", ".svn", "nls", "tests", "demos", "resources"]

def getfiles(dir):
    ret = []
    for file in _sort(os.listdir(dir)):
        if file!="." and file!="..":
            if os.path.isdir(dir + os.path.sep + file) and file not in skip_dirs:
                children = getfiles(dir + os.path.sep + file)
                if len(children):
                    ret.append({"name":file, "children":children})
            elif file.endswith(".js"):
                # If the name is the same as the previous container it can also be inspected.
                # Otherwise it's just a folder which is foldable.
                if len(ret) and ret[-1]["name"] == file[0:-3]:
                    ret[-1]["type"] = "module"
                else:
                    name = file[0:-3]
                    ret.append({"name":name, "type":_gettype(name)})
    return ret

def _gettype(file):
    if file[0]!="_" and file[0].lower()==file[0]:
        type = "object"
    elif file.endswith("Mixin"):
        type = "mixin"
    else:
        type = "class"
    return type

def _sort(files):
    # Sort the files alphabetically ignoring the case and moving all files starting
    # with "_" to the end.
    files.sort(lambda x,y:x.lower()<y.lower()) # Sort them ignoring the case.
    ret = []
    ret = [f for f in files if not f.startswith("_")] # Get all files NOT starting with an underscore.
    ret.extend([f for f in files if f.startswith("_")]) # Append all WITH underscore at end.
    return ret

def _render(files, level=0):
    # Render the structure.
    level += 1
    ret = []
    for f in files:
        if f.has_key("children"):
            if f.has_key("type"):
                type = ' type:"%s",' % f["type"]
            else:
                type = ""
            ret.append(
                '%s{name:"%s",%s children:[\n' % ("\t"*level, f["name"], type)+
                ",\n".join(_render(f["children"], level))+
                "\n%s]}" % ("\t"*level))
        else:
            ret.append('%s{name:"%s", type:"%s"}' % ("\t"*level, f["name"], f["type"]))
    return ret

structure = [{"name":rootname, "type":"module", "children":getfiles(root)}]
print "["
print ",\n".join(_render(structure))
print "]"
