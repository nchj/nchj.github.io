# PROXY operating in java

代理模式（Proxy）为其他对象提供一种代理，以控制对这个对象的访问。代理对象在客户端和目标对象之间起到中介的作用。

代理模式的作用:在某些情况下，一个客户类不想或者不能直接引用一个委托对象，而代理类对象可以在客户类和委托对象之间起到中介的作用。

代理类和委托类实现相同的接口。代理类除了是客户类和委托类的中介之外，我们还可以通过给代理加入额外功能来扩展委托类的功能，这样做我们只需要修改代理类而不需要再修改委类，符合代码设计的开闭原则。

常见的代理有动态代理和静态代理，下面讲解java中实现静态代理的jdk动态代理。

# basic code

```java
public interface GameFactory {
    String make();
}
```
```java
public class PS4Factory implements GameFactory {
    @Override
    public String make() {
        return "PS4";
    }
}

```
```java
public class XBOXFactory implements GameFactory {

    @Override
    public String make() {
        return "XBOX";
    }
}

```

# A example of static proxy
A user want to buy from a game factory, but he can't buy directly from the factory, he need to buy from a proxy.

now demo a static proxy
```java
public class BadStaticProxy implements GameFactory {

    private final GameFactory gameFactory;

    public BadStaticProxy(GameFactory gameFactory) {
        this.gameFactory = gameFactory;
    }

    @Override
    public String make() {
        doSomethingBefore();
        String res = gameFactory.make();
        System.out.println(res);
        doSomethingAfter();
        return res;
    }

    private void doSomethingBefore() {
        System.out.println("do something before");
    }

    private void doSomethingAfter() {
        System.out.println("do something after");
    }
}
```
usage
```java
class App{
    public static void main(String[] args) {
        System.out.println("now Im a ps4 proxy");
        GameFactory ps4Factory = new PS4Factory();
        BadStaticProxy badStaticProxy = new BadStaticProxy(ps4Factory);
        badStaticProxy.make();
        System.out.println();
        System.out.println("now Im a xbox proxy");
        badStaticProxy = new BadStaticProxy(new XBOXFactory());
        badStaticProxy.make();
    }
}
```
bad points:
* 每额外代理一个类，就需要额外写一个代理类或者实现这个给类的所有方法，工作量大

* 委托类每加入一个接口，代理类也要加入这个接口，即使这个接口是代理类不关心的

# A example of dynamic proxy
```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class GoodDynamicProxy implements InvocationHandler {
    private Object target;

    public GoodDynamicProxy(Object target) {
        this.target = target;
    }

    public Object getTarget() {
        return target;
    }

    public void setTarget(Object target) {
        this.target = target;
    }

    public Object getProxy() {
        return Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                this
        );
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        doSomethingBefore();
        Object res = method.invoke(target, args);
        doSomethingAfter();
        return res;
    }

    private void doSomethingBefore() {
        System.out.println("do something before");
    }

    private void doSomethingAfter() {
        System.out.println("do something after");
    }
}
```
usage
```java
class App{
    public static void main(String[] args) {
        System.out.println("now Im a ps4 proxy");
        GameFactory ps4Factory = new PS4Factory();
        GoodDynamicProxy goodDynamicProxy = new GoodDynamicProxy(ps4Factory);
        GameFactory proxy = (GameFactory) goodDynamicProxy.getProxy();
        proxy.make();
        System.out.println();
        System.out.println("now Im a xbox proxy");
        goodDynamicProxy.setTarget(new XBOXFactory());
        proxy = (GameFactory) goodDynamicProxy.getProxy();
        proxy.make();
    }
}
```

# summary

在这个案例中，动态代理的代码看似更加复杂，但当需要代理的类变多时，动态代理的优势就体现出来了，只需要一个动态代理类就可以了，而静态代理需要为每一个类都写一个代理类，工作量大，而且当委托类加入一个接口时，代理类也要加入这个接口，即使这个接口是代理类不关心的，而动态代理不需要关心委托类的接口，只需要实现InvocationHandler接口即可。