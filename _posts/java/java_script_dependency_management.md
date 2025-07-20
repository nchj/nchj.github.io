Java 脚本快速管理和运行依赖

本文档描述如何便捷地运行具有外部依赖的 Java 脚本，并使用 JShell 和 Maven 管理依赖的具体方法。

场景描述

你有一个 Java 脚本，依赖于其他 Maven package，并希望通过命令行快速运行而不必创建完整的 Maven 项目结构。

方法一：使用 JBang（推荐）

JBang 可以自动拉取 Maven 依赖，直接运行单文件 Java 脚本。

安装 JBang:

curl -Ls https://sh.jbang.dev | bash -s - app setup

示例 Java 脚本:

///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.google.guava:guava:32.1.2-jre

import com.google.common.base.Joiner;

public class MyScript {
public static void main(String[] args) {
System.out.println(Joiner.on(", ").join(args));
}
}

执行脚本:

jbang MyScript.java a b c

方法二：使用 Maven exec 插件

如果已有 pom.xml，可以用 Maven 插件运行指定 Java 类。

示例 Java 脚本:

package com.example;

import org.apache.commons.lang3.StringUtils;

public class MyScript {
public static void main(String[] args) {
System.out.println(StringUtils.join(args, ", "));
}
}

修改 pom.xml:

<build> <plugins> <plugin> <groupId>org.codehaus.mojo</groupId> <artifactId>exec-maven-plugin</artifactId> <version>3.1.1</version> <configuration> <mainClass>com.example.MyScript</mainClass> <arguments> <argument>a</argument> <argument>b</argument> <argument>c</argument> </arguments> </configuration> </plugin> </plugins> </build>
执行命令:

mvn compile exec:java

方法三：使用 JShell 快速加载 Maven 依赖

获取 Maven classpath：

生成 classpath 文件：
mvn dependency:build-classpath -Dmdep.outputFile=classpath.txt

或直接通过标准输出：
jshell --class-path "$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout)"

启动 JShell:
jshell --class-path $(cat classpath.txt)

JShell 中使用依赖:
import org.apache.commons.lang3.StringUtils;

System.out.println(StringUtils.join(new String[]{"Hello", "World"}, ", "));
