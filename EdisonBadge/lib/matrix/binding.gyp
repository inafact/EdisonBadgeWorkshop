{
  "targets" : [
    {
        "target_name" : "LEDMatrix8x8",
        "sources"     : ["LEDMatrix8x8.cxx", "LEDMatrix8x8_wrap.cxx"],
        "include_dirs" : ['/usr/include/mraa', '/usr/include/'],
        "link_settings" : {
            "libraries" : ['-lmraa',]
        },
        'cflags!': [ '-fno-exceptions' ],
        'cflags_cc!': [ '-fno-exceptions' ]
    }
  ]
}
