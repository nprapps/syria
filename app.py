#!/usr/bin/env python

import app_config
import json
import os
import static

from flask import Flask, make_response, render_template
from jinja2 import contextfunction, Environment, FileSystemLoader
from render_utils import make_context, smarty_filter, urlencode_filter, markdown_filter
from werkzeug.debug import DebuggedApplication

app = Flask(__name__)
app.debug = app_config.DEBUG

app.add_template_filter(smarty_filter, name='smarty')
app.add_template_filter(urlencode_filter, name='urlencode')
app.add_template_filter(markdown_filter, name='markdown')


# Example application views
@app.route('/')
def index():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    context = make_context()

    with open('data/featured.json') as f:
        context['featured'] = json.load(f)

    return make_response(render_template('index.html', **context))

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

@app.route('/test_widget.html')
def test_widget():
    """
    Example page displaying widget at different embed sizes.
    """
    return make_response(render_template('test_widget.html', **make_context()))

@contextfunction
def render_file(context, path):
    """
    Render a file with the current context
    """
    env = Environment(loader=FileSystemLoader('www/assets'))
    template = env.get_template(path)
    return template.render(**context)

@contextfunction
def photos(context, id):
    """
    Render one or more photos defined in the spreadsheet.
    """
    return "hi"

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
