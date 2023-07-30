# -*- coding: utf-8 -*-


import flask
import requests

app = flask.Flask(__name__)

method_requests_mapping = {
    'GET': requests.get,
    'HEAD': requests.head,
    'POST': requests.post,
    'PUT': requests.put,
    'DELETE': requests.delete,
    'PATCH': requests.patch,
    'OPTIONS': requests.options,
}

@app.route('/<path:url>', methods=method_requests_mapping.keys())
def proxy(url):
    if flask.request.method == 'OPTIONS':
        # Handle preflight request
        response = flask.Response()
    else:
        print(flask.request.get_json())
        print(flask.request.args)
        requests_function = method_requests_mapping[flask.request.method]
        request = requests_function(url, stream=True, params=flask.request.args, headers=flask.request.headers,json=flask.request.get_json())
        response = flask.Response(flask.stream_with_context(request.iter_content()),
                                content_type=request.headers['content-type'],
                                status=request.status_code)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    app.debug = True
    app.run()
