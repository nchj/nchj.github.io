---
Title: windows关闭延缓自动更新小技巧
Date: 2023-12-03
Tags: [windows]
---

windows10之后的自动更新屡禁不止，如何关闭自动更新呢。

发现了一种曲线救国的方式，不通过关闭自动更新，而是通过延缓自动更新的方式来达到关闭自动更新的目的，步骤如秀啊

1. 进入注册表编辑器，可以按下win+R键，输入regedit进入，也可选择你喜欢的其他方式进入。
2. 找到`\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings`这个路径
3. 在Settings里面，右键新建一个`DWORD`(32位)值，命名为`FlightSettingsMaxPauseDays`
4. 双击新建的这个参数，基数选择为十进制，然后在数值数据里面填写一个整数，即为你想要暂停接收更新的天数，如365，点击确定。
5. 最后在设置里面找到Windows更新，在里面找到暂停更新的选项，本来最长只能暂停1周的更新，在配置完上面的参数后，这里的选项加长了很多，第4步填写的4000就是可暂停的最大天数。

---
copyright: this post is copied from [another blog](https://blog.meekdai.com/post/yan-chang-WIN-zi-dong-geng-xin-ri-qi.html)
