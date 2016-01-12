from bottle import route, run, template, static_file

@route('/')
def index(name="nothing"):
    return template('./index.html')

@route('/<filename:path>')
def getfile(filename):
    return static_file(filename, root='.')

@route('/codemirror/<filename:path>')
def codemirror(filename):
    return static_file(filename, root='./codemirror')

run (host = 'localhost', port = 8899)
