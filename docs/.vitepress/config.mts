import { defineConfig } from 'vitepress'

const nav = [
  {
    "text": "首页",
    "link": "/"
  },
  {
    "text": "文章",
    "link": "/posts/"
  },
  {
    "text": "关于",
    "link": "/about"
  }
]
const sidebar = {
  "/posts/": [
    {
      "text": "未分类",
      "collapsed": false,
      "items": [
        {
          "text": "在 Python 中使用 Playwright 调用 JavaScript API",
          "link": "/posts/misc/在python中使用playwright调用javascript-api"
        }
      ]
    },
    {
      "text": "Java",
      "collapsed": false,
      "items": [
        {
          "text": "LocalDateTime 转 ZonedDateTime",
          "link": "/posts/java/localdatatime转zoneddatatime"
        },
        {
          "text": "HashMap的常见知识点",
          "link": "/posts/java/java-hashmap"
        },
        {
          "text": "spring-boot-starter-data-redis 主要功能和使用方法",
          "link": "/posts/java/springboot/spring-boot-redis"
        },
        {
          "text": "Spring 自动装配注解的区别",
          "link": "/posts/java/springboot/spring自动装配注解的区别"
        },
        {
          "text": "通过 Queue 实现线程间通信",
          "link": "/posts/java/java通过queue实现线程间通讯"
        },
        {
          "text": "Java 中常见的 XO 概念",
          "link": "/posts/java/springboot/java中常见的xo"
        },
        {
          "text": "Java 中锁的特性",
          "link": "/posts/java/multithread/java锁"
        },
        {
          "text": "VarHandle",
          "link": "/posts/java/multithread/varhandler"
        },
        {
          "text": "为什么使用线程池",
          "link": "/posts/java/multithread/threadpool"
        },
        {
          "text": "线程通信",
          "link": "/posts/java/multithread/线程通信"
        },
        {
          "text": "线程安全之可见性",
          "link": "/posts/java/multithread/线程安全之可见性"
        },
        {
          "text": "线程安全之原子性",
          "link": "/posts/java/multithread/线程安全之原子性"
        },
        {
          "text": "多线程",
          "link": "/posts/java/简答题/简答题"
        },
        {
          "text": "内存屏障",
          "link": "/posts/java/multithread/内存屏障"
        },
        {
          "text": "Spring Boot 配置使用 SLF4J 及其原理",
          "link": "/posts/java/springboot/springboot配置使用slf4j及其原理"
        },
        {
          "text": "Spring Boot",
          "link": "/posts/java/springboot/"
        },
        {
          "text": "Java线程的六种状态",
          "link": "/posts/java/multithread/multiprocess-basic"
        },
        {
          "text": "Java 脚本快速管理和运行依赖",
          "link": "/posts/java/java-script-dependency-management"
        },
        {
          "text": "Java 多线程",
          "link": "/posts/java/multithread/"
        },
        {
          "text": "Java 外部类为什么可以访问内部类的私有成员变量",
          "link": "/posts/java/简答题/复杂问题"
        },
        {
          "text": "Java 中读取文件",
          "link": "/posts/java/get-file-in-java"
        },
        {
          "text": "Java 中读取常见 JSON",
          "link": "/posts/java/read-common-json-in-java"
        },
        {
          "text": "Java 中的代理",
          "link": "/posts/java/proxy"
        },
        {
          "text": "Java Lambda 异常处理",
          "link": "/posts/java/java-lambda-exceptions"
        },
        {
          "text": "Java",
          "link": "/posts/java/"
        }
      ]
    },
    {
      "text": "Python",
      "collapsed": false,
      "items": [
        {
          "text": "python实现异步初始化",
          "link": "/posts/python/python实现异步初始化"
        },
        {
          "text": "python try...except...else 中 else 的作用",
          "link": "/posts/python/python-try-except-else"
        },
        {
          "text": "Python 抽象基类",
          "link": "/posts/python/abstract-baseclass"
        },
        {
          "text": "Python Lint and Check",
          "link": "/posts/python/python-lint-and-check"
        },
        {
          "text": "Python 不生成字节码的方法",
          "link": "/posts/python/pip-without-pyc"
        }
      ]
    },
    {
      "text": "MySQL",
      "collapsed": false,
      "items": [
        {
          "text": "mysql select 执行过程",
          "link": "/posts/mysql/mysql-索引"
        },
        {
          "text": "MySQL 配置目录、文件关系与调优总结",
          "link": "/posts/mysql/mysql-config-structure-summary"
        },
        {
          "text": "MySQL 用户操作",
          "link": "/posts/mysql/user-operation"
        }
      ]
    },
    {
      "text": "Docker",
      "collapsed": false,
      "items": [
        {
          "text": "在容器中使用 systemd",
          "link": "/posts/docker/enable-systemd-in-container"
        },
        {
          "text": "Docker 安装后的基础设置",
          "link": "/posts/docker/setup-after-install-docker"
        },
        {
          "text": "Docker 中的 MySQL 配置",
          "link": "/posts/docker/mysql-with-docker"
        },
        {
          "text": "Docker CMD and ENTRYPOINT",
          "link": "/posts/docker/entrypoint-vs-cmd"
        }
      ]
    },
    {
      "text": "Git",
      "collapsed": false,
      "items": [
        {
          "text": "git 是否会delta压缩",
          "link": "/posts/git/git-internal"
        },
        {
          "text": "Git 合并两个非共同祖先分支",
          "link": "/posts/git/git合并两个非共同祖先分支"
        },
        {
          "text": "Git 创建远程分支",
          "link": "/posts/git/git-create-remote-branch"
        }
      ]
    },
    {
      "text": "Shell",
      "collapsed": false,
      "items": [
        {
          "text": "编写 Systemd Service",
          "link": "/posts/shell/编写systemd-service"
        },
        {
          "text": "一个命令判断是否是大小端",
          "link": "/posts/shell/一个命令判断是否是大小端"
        }
      ]
    },
    {
      "text": "算法",
      "collapsed": false,
      "items": [
        {
          "text": "二分查找算法简要",
          "link": "/posts/algo/binary-search"
        },
        {
          "text": "莱文斯坦距离(Levenshtein distance)",
          "link": "/posts/algo/levenshtein-distance"
        }
      ]
    },
    {
      "text": "杂项",
      "collapsed": false,
      "items": [
        {
          "text": "macOS 的 hostname",
          "link": "/posts/misc/macos-的hostname"
        },
        {
          "text": "Hyper-V 配置 GPU 分区",
          "link": "/posts/misc/hyperv配置gpu分区"
        },
        {
          "text": "Redis 常见面试题",
          "link": "/posts/misc/redis常见面试题"
        },
        {
          "text": "SNS与SQS的区别",
          "link": "/posts/misc/sns与sqs的区别"
        },
        {
          "text": "Java的变量遮蔽与Python的属性查找：继承中的重要差异",
          "link": "/posts/misc/java-python-inheritance-difference"
        },
        {
          "text": "新购入一台 M4 Mac mini，记录配置这台 Mac mini 的过程",
          "link": "/posts/misc/config-a-m-seris-mac-mini"
        }
      ]
    },
    {
      "text": "Windows",
      "collapsed": false,
      "items": [
        {
          "text": "Windows11无法使用保存的远程凭证解决方案",
          "link": "/posts/windows/windows11无法使用保存的远程凭证解决方案"
        },
        {
          "text": "Windows 关闭延缓自动更新小技巧",
          "link": "/posts/windows/windwos关闭延缓自动更新小技巧"
        }
      ]
    },
    {
      "text": "读书",
      "collapsed": false,
      "items": [
        {
          "text": "未命名",
          "link": "/posts/books/ddia/未命名"
        }
      ]
    },
    {
      "text": "C",
      "collapsed": false,
      "items": [
        {
          "text": "C 语言的定义和声明",
          "link": "/posts/c/definition-and-declaration"
        }
      ]
    },
    {
      "text": "Talks",
      "collapsed": false,
      "items": [
        {
          "text": "什么是RESTful？用它还是不用它？",
          "link": "/posts/talks/what-is-restful-use-it-or-not"
        }
      ]
    },
    {
      "text": "Zero Copy",
      "collapsed": false,
      "items": [
        {
          "text": "Zero Copy",
          "link": "/posts/zero-copy/"
        }
      ]
    }
  ]
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'NCHJ 的笔记',
  description: '技术笔记与工程实践整理',
  lastUpdated: true,
  cleanUrls: true,
  themeConfig: {
    nav,
    sidebar,
    socialLinks: [{ icon: 'github', link: 'https://github.com/nchj/nchj.github.io' }],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于' },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
