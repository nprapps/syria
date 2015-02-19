#!/usr/bin/env python

import app_config
import json
import os
import re
import static

from fabfile.text import update as update_google_doc
from flask import Flask, Markup, make_response, render_template
from jinja2 import contextfunction, Environment, FileSystemLoader
from render_utils import make_context, smarty_filter, urlencode_filter, markdown_filter
from werkzeug.debug import DebuggedApplication

app = Flask(__name__)
app.debug = app_config.DEBUG

app.add_template_filter(smarty_filter, name='smarty')
app.add_template_filter(urlencode_filter, name='urlencode')
app.add_template_filter(markdown_filter, name='markdown')

from authomatic.providers import oauth2
from authomatic.adapters import WerkzeugAdapter
from authomatic import Authomatic

CONFIG = {
    'google': {
        'class_': oauth2.Google,
        'consumer_key': '921080749115-81ufuqikpuvikbas04n1jgj4pdqp9ren.apps.googleusercontent.com',
        'consumer_secret': 'bOtbTuANzYDgubzbJ1rD0tv2',
        'scope': ['https://www.googleapis.com/auth/drive.readonly']
    },
}

authomatic = Authomatic(CONFIG, 'mysecretstring')


# Example application views
@app.route('/')
def index():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    update_google_doc()
    context = make_context()

    with open('data/featured.json') as f:
        context['featured'] = json.load(f)

    return make_response(render_template('index.html', **context))

@app.route('/login/', methods=['GET', 'POST'])
def login():
    from flask import request
    response = make_response()
    result = authomatic.login(WerkzeugAdapter(request, response), 'google')
    if result:
        #import ipdb; ipdb.set_trace();
        context = make_context()
        return render_template('login.html', result=result)
    return response

@app.route('/comments/')
def comments():
    """
    Full-page comments view.
    """
    return make_response(render_template('comments.html', **make_context()))

@app.route('/widget.html')
def widget():
    """
    Embeddable widget example page.
    """
    return make_response(render_template('widget.html', **make_context()))

@contextfunction
def render_file(context, path):
    """
    Render a file with the current context
    """
    env = Environment(loader=FileSystemLoader('www/assets'))
    template = env.get_template(path)
    return template.render(**context)

@contextfunction
def photos(context, group):
    """
    Render one or more photos defined in the spreadsheet.
    """
    photoset = [photo for photo in context['COPY']['photos'] if photo['group'] == group]
    whitespace_regex = re.compile(r'\s+') # Remove whitespace for Markdown embedding
    fragments = []
    for row in photoset:
        template = '%s.html' % row['template']
        output = render_template(template, row=row)
        output = whitespace_regex.sub(' ', output)
        fragments.append(output)

    return Markup("".join(fragments))

def note(text):
    """
    Return a note.
    """
    return render_template('_note.html', note=text)

@app.context_processor
def context_processor():
    """
    Add our app's functions
    """
    context = {}
    context['render_file'] = render_file
    context['photos'] = photos
    context['note'] = note
    return context

app.register_blueprint(static.static)

# Enable Werkzeug debug pages
if app_config.DEBUG:
    wsgi_app = DebuggedApplication(app, evalex=False)
else:
    wsgi_app = app

# Catch attempts to run the app directly
if __name__ == '__main__':
    if not os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        print 'This command has been deprecated! Please run "fab app" instead!'

    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port')
    args = parser.parse_args()
    server_port = 8000

    if args.port:
        server_port = int(args.port)

    app.run(host='0.0.0.0', port=server_port, debug=app_config.DEBUG)
