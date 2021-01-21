#!/usr/bin/python
# -*- coding: utf-8 -*-

import appier

class RipeDemoApp(appier.WebApp):
    """
    The main app class for the Ripe Demo instance
    should configure the instance main points.
    """

    def __init__(self, *args, **kwargs):
        appier.WebApp.__init__(
            self,
            name = "ripe_demo",
            *args, **kwargs
        )

if __name__ == "__main__":
    app = RipeDemoApp()
    """
    SMAA pass for the post-processing requires loading of script-src,
    so we set that specific content security measure;    
    """
    app.content_security = "default-src * ws://* wss://* data: blob:; script-src blob: * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';"
    app.serve()
else:
    __path__ = []
