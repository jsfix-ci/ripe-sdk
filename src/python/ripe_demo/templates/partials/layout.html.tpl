{% block html %}
    <!DOCTYPE html>
    <html>
    <head>
        {% block head scoped %}
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <link rel="stylesheet" type="text/css" href="{{ touch('//libs.platforme.com/uxf/css/ux-min.css') }}" />
            <link rel="stylesheet" type="text/css" href="{{ touch('//libs.platforme.com/layout/css/layout.flat.css') }}" />
            <link rel="stylesheet" type="text/css" href="{{ url_for('static', filename = 'css/layout.css') }}" />
            <link rel="shortcut icon" href="{{ url_for('static', filename = 'images/favicon.ico') }}" />
            <script type="text/javascript" src="{{ touch('//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js') }}"></script>
            <script type="text/javascript" src="{{ touch('//libs.platforme.com/uxf/js/ux-min.js') }}"></script>
            <script type="text/javascript" src="{{ touch('//libs.platforme.com/layout/js/layout-min.js') }}"></script>
            
            <link rel="stylesheet" type="text/css" href="{{ url_for('static', filename = 'css/ripe.css') }}" />
            <script type="text/javascript" src="{{ url_for('static', filename = 'js/ripe.js', compress = 'js') }}"></script>
            <script type="text/javascript" src="{{ url_for('static', filename = 'assets/configs/swear/vyner_hitop.js') }}"></script>
            
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/build/three.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/dat.gui/master/build/dat.gui.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/loaders/FBXLoader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/loaders/GLTFLoader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/loaders/RGBELoader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/CopyShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/ConvolutionShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/EffectComposer.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/RenderPass.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/BloomPass.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/SSAARenderPass.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/TAARenderPass.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/UnpackDepthRGBAShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/DepthLimitedBlurShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/SAOShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/SAOPass.min.js"></script> 
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/math/SimplexNoise.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/shaders/SSAOShader.min.js"></script>
            <script src="https://cdn.statically.io/gh/veryprofessionaldodo/three.js/dev/examples/js/postprocessing/SSAOPass.min.js"></script>
            
            <script type="text/javascript" src="{{ url_for('static', filename = 'js/main.js', compress = 'js') }}"></script>
            <title>{{ title }}{% block title %}RIPE SDK Demo{% endblock %}</title>
        {% endblock %}
    </head>
    <body class="{% block body_class %}ux wait-load{% endblock %}" data-url="{{ url|default('', True) }}"
             data-brand="{{ brand|default('', True) }}" data-model="{{ model|default('', True) }}"
             data-variant="{{ variant|default('', True) }}" data-version="{{ version|default('', True) }}"
             data-country="{{ country|default('', True) }}" data-currency="{{ currency|default('', True) }}"
             data-mode="{{ mode|default('full', True) }}" data-client_id="{{ client_id|default('', True) }}"
             data-client_secret="{{ client_secret|default('', True) }}" data-guess="{{ '1' if guess else '0' }}"
             data-guess_url="{{ '1' if guess_url else '0' }}">
        <div id="header" class="header">
            {% block header %}
                <div class="header-container">
                    <a class="logo-link" href="https://github.com/ripe-tech/ripe-sdk" target="_blank">
                        <img class="image-lazy logo"
                             data-url="{{ url_for('static', filename = 'images/logo.png') }}"
                             data-url_retina="{{ url_for('static', filename = 'images/logo-2x.png') }}" />
                    </a>
                </div>
            {% endblock %}
        </div>
        <div id="content" class="content">{% block content %}{% endblock %}</div>
        <div id="footer" class="footer">
            {% block footer %}
                <div class="footer-container">
                    <span>&copy; 2008-2020 Platforme</span>
                </div>
            {% endblock %}
        </div>
    </body>
    </html>
{% endblock %}
