# EightBittr
[![Build Status](https://travis-ci.org/FullScreenShenanigans/EightBittr.svg?branch=master)](https://travis-ci.org/FullScreenShenanigans/EightBittr)

An abstract class used exclusively as the parent of GameStartr. EightBittr 
contains useful functions for manipulating Things that are independent of the 
required GameStartr modules.


## Build Process

EightBittr uses [Grunt](http://gruntjs.com/) to automate building, which 
requires [Node.js](http://node.js.org). The process is straightforward; see 
[Grunt's help page](http://gruntjs.com/getting-started) for more info.

To build from scratch, install NodeJS, and run the following commands:

```
npm install
grunt
```

The output will now be in the /dist folder. Source codes will be in /dist/src,
and a zipped version will be in /dist.
