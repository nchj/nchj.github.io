---
title: LocalDataTime转ZonedDataTime
date: 2023-05-18 14:54:00 +0800
categories: [java]
tags: [java]
---


```java
    /**
     * 将LocalDateTime转换为UTC时间的ZonedDateTime对象
     * 
     * @param localDateTime 要转换的本地日期时间对象
     * @return 对应的UTC时间ZonedDateTime对象
     */

    public static ZonedDateTime convertToUTC(LocalDateTime localDateTime) {
        // 获取系统默认时区（或可以指定特定时区）
        ZoneId systemDefaultZone = ZoneId.systemDefault();
        // 将LocalDateTime转换为带有时区信息的ZonedDateTime对象
        // 这里使用系统默认时区作为源时区
        ZonedDateTime zonedDateTime = localDateTime.atZone(systemDefaultZone);
        // 转换为UTC时区
        ZonedDateTime utcDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of("UTC"));
        return utcDateTime;
    }
```


Date转ZonedDataTime
```java
new Date().toInstant().atZone(ZoneId.systemDefault())
```
