# 标题

此处假设资源文件放在 src/main/resources 目录下或者 src/test/resources 目录下

## 如何在没有打包的时候读取文件

在没有打包的时候，常见的场景时在 IDE 中运行项目，这时候可以直接使用相对路径读取资源文件。
一般情况下，这里的相对路径是相对项目根目录的, 视你的 IDE 设定为准

```java
import java.io.File;

public class YourClass {
    public File getJsonFile() {
        // 使用相对路径获取JSON文件
        String filePath = "src/main/resources/example.json";
        return new File(filePath);
    }
}
```

## 如何在打包之后也能读取文件

src/main/resources 目录是 Maven 项目的约定目录，其中的资源文件会被 Maven 打包到最终的 JAR 文件中。

例如 src/main/resources/example.json 在 jar 包内的位置就是 example.json

此时必须用 classLoader 来获取资源文件，因为在打包后，资源文件不再是一个普通的文件，而是一个位于 jar 包内的文件。
当然，你也能自己构造一个位于 jar 包中的文件路径，但是这样的做法不够优雅，也容易出错，在 jar 包所在位置后加一个感叹号，例如：/path/to/your.jar!/example.json

```java
import java.io.File;
import java.net.URISyntaxException;
import java.net.URL;

public class YourClass {
    public File getJsonFile() throws URISyntaxException {
        // 使用ClassLoader获取JSON文件的URL
        ClassLoader classLoader = getClass().getClassLoader();
        URL resourceUrl = classLoader.getResource("example.json");

        // 将URL转换为File对象
        File file = null;
        if (resourceUrl != null) {
            file = new File(resourceUrl.toURI());
        }

        return file;
    }
}
```

## 如何兼容打包和不打包的时候都能读取文件

如果我这个 maven 项目还没被打成包，也想读这个文件，同时也兼顾打包后读这个 resour 文件，这是最可能的场景了，灵活使用 try catch 即可

```java
import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;

public class YourClass {
    public File getJsonFile() throws IOException, URISyntaxException {
        // 使用ClassLoader获取JSON文件的URL
        ClassLoader classLoader = getClass().getClassLoader();
        URL resourceUrl = classLoader.getResource("example.json");

        // 如果资源文件未被打包，则尝试使用绝对路径
        File file;
        if (resourceUrl == null) {
            // 获取资源文件的绝对路径
            String absolutePath = new File("src/main/resources/example.json").getAbsolutePath();
            file = new File(absolutePath);
        } else {
            // 将URL转换为File对象
            file = new File(resourceUrl.toURI());
        }

        return file;
    }
}
```

## test 项目如何读取文件

通常将测试资源文件放在 src/test/resources 目录下，这样它们就不会被包含在最终构建的 JAR 或 WAR 文件中，同时仍然可以在单元测试中方便地访问。

一般情况下，测试是在打包的时候不会被包含的，maven 的生命周期中，test 是在 package 之前的，所以是在打包之前就已经执行了，所以测试资源文件不会被打包，使用相对路径即可

```java
import com.example.App;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import static org.junit.jupiter.api.Assertions.*;

public class AppTest {

    @Test
    public void testReadJsonFile() {
        // 获取测试资源文件的路径
        String filePath = "src/test/resources/example.json";

        // 读取JSON文件内容
        String jsonContent = null;
        try {
            jsonContent = new String(Files.readAllBytes(Paths.get(filePath)));
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 执行被测试的方法
        App app = new App();
        String result = app.readJsonFile(filePath);

        // 断言结果是否与预期相符
        assertEquals(jsonContent, result, "读取JSON文件内容与预期不符");
    }
}
```