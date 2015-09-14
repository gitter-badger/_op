// Process User config
var fs = require('fs');
var jsonFile = fs.readFileSync('../config.json'), jsonString,
  theme, title, url, post_sort, host_ip, host_port, cache_exp, req_log;

try {
  jsonString      = JSON.parse(jsonFile);
  var THEME       = jsonString['theme'],
      SITE_TITLE  = jsonString['title'],
      SITE_URL    = jsonString['url'],
      POST_SORT   = jsonString['post_sort'],
      SERV_HOST   = jsonString['host_ip'],
      SERV_PORT   = jsonString['host_port'],
      CACHE_EXP   = jsonString['cache_exp'],
      REQ_LOG     = jsonString['req_log'];
  
  } catch (err) {
    console.log('There is an error parsing the json file : ' + err);
}

// Load Required Modules
var staticsmith   = require('staticsmith')
  , markdown      = require('staticsmith-markdown-remarkable')
  , fileMetadata  = require('staticsmith-filemetadata')
  , snippet       = require('staticsmith-snippet')
  , tags          = require('staticsmith-tags')
  , drafts        = require('staticsmith-drafts')
  , templates     = require('staticsmith-templates')
  , serve         = require('staticsmith-serve')
  , watch         = require('staticsmith-watch')
  , excerpts      = require('staticsmith-excerpts')
  , collections   = require('staticsmith-collections')
  , branch        = require('staticsmith-branch')
  , permalinks    = require('staticsmith-permalinks')
  , feed          = require('staticsmith-feed')
  , wordcount     = require('staticsmith-word-count')
  , sitemap       = require('staticsmith-sitemap')
  , moment        = require('moment');

// Builder
var siteBuild = staticsmith(__dirname)

    .metadata({
      site: {
        title: SITE_TITLE,
        url: SITE_URL
      }
    })

    .source('../content')
    .destination('../_public')
    .clean(false)

    .use(markdown('full', {
      breaks:       true,
      html:         true,
      linkify:      true,
      typographer:  true,
      quotes:       '«»‘’'
    }))

    // Adds YAML front matter on files based on a pattern
    .use(fileMetadata([
      {pattern: "posts/*", metadata: {
        "template": "post.jade"
      }}
    ]))

    // Front matter for extracting snippets
    .use(snippet({
      maxLength: 250,
      suffix: '...'
    }))

    // Create dedicated pages for tags
    .use(tags({
      handle: 'tags',           // yaml key for tag list in you pages
      path:'posts/topics/:tag.html',  // path for result pages
      sortBy: 'date',
      reverse: true,
      skipMetadata: false
    }))

    // Hides any file marked 'draft: true'
    .use(drafts())

    // Extract the first paragraph from the beginning of any HTML file
    .use(excerpts())

    .use(collections({
      posts: {
        pattern:  'posts/**.html',
        sortBy:   POST_SORT,
        reverse:  true
      }
    }))

    .use(branch('posts/**.html')
        .use(permalinks({
          pattern: 'posts/:title',
          relative: false
        }))
    )

    .use(branch('!posts/**.html')
        .use(branch('!index.md').use(permalinks({
          relative: false
        })))
    )

    .use(wordcount({
      metaKeyCount:       "wordCount",
      metaKeyReadingTime: "readingTime",
      speed:              300,
      seconds:            false,
      raw:                false
    }))

    .use(templates({
      engine:     'jade',
      directory:  '../themes/' + THEME + '/tpls',
      default:    'base.jade',
      moment:     moment
    }))

    .use(feed({
      collection: 'posts'
    }))

    .use(sitemap({
      output:       'sitemap.xml',
      urlProperty:  'path',
      hostname:     SITE_URL,
      defaults: {
        priority:   0.5,
        changefreq: 'daily'
      }
    }));

if (process.env.NODE_ENV !== 'production') {
  siteBuild = siteBuild

    .use(serve({
      host:     SERV_HOST || process.env.IP,
      port:     SERV_PORT || process.env.PORT,
      cache:    CACHE_EXP,
      verbose:  REQ_LOG
    }))

    .use(watch({
      pattern:    '**/*',
      livereload: true
    }));
}

siteBuild.build(function (err) {
  if (err) {
    console.log(err);
  }
  else {
    console.log('Site build complete!');
  }
});