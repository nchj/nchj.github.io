---
title: "使用 AWS EMR Studio"
category: "未分类"
---

数据分析：EMR studio



## 准备

创建一个S3 bucket或者使用已有的bucket， 此bucket会被用于存放EMR studio中的notebook

## 创建EMR Studio

创建studio时，可以选择一些预设，界面中叫做设置选项，包括

**交互式工作负载**

创建具有存储、组织和运行活动的笔记本所需的存储空间和权限的 Studio、工作区和 EMR Serverless 应用程序。

**批处理任务**

创建 Studio 和 EMR Serverless Spark 应用程序以提交批量作业。

**Custom (自定义)**

指定所有 EMR Studio 设置，例如身份验证、联网和安全性（Amazon EC2 和 Amazon EKS 上的 EMR 集群需要）以及适合您的用例的标签。

以notebook为例，AWS给出了下面的配置预设，这在创建阶段不可更改。

![集群设置](./use-aws-emr-studio/emr-studio-application-config.png)

**AmazonEMRStudio_RuntimeRole_RandomId**

可信实体是AWS 服务: emr-serverless，目前的理解是，job在运行的时候会使用这个权限。这个role会在创建EMR Studio的时候被自动创建，然后手动为其增加权限，例如读写S3数据，也可以提前创建好这个权限，在创建studio的时候选用。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::kolmo-982397314956-datainfra-test",
                "arn:aws:s3:::kolmo-982397314956-datainfra-test/*"
            ],
            "Condition": {
                "StringEquals": {
                    "aws:ResourceAccount": "982397314956"
                }
            }
        },
        {
            "Action": [
                "s3:GetBucket*",
                "s3:GetObject*",
                "s3:List*"
            ],
            "Resource": [
                "arn:aws:s3:::kolmo-982397314956-us-west-1-data-collection",
                "arn:aws:s3:::kolmo-982397314956-us-west-1-data-collection/ntmf-ftp-sbas/*",
                "arn:aws:s3:::kolmo-982397314956-us-west-1-data-collection/dvc_data/*"
            ],
            "Effect": "Allow",
            "Condition": {
                "StringEquals": {
                    "aws:ResourceAccount": "982397314956"
                }
            }
        }
    ]
}
```

可信实体是AWS 服务: elasticmapreduce，EMR studio本身会使用这个权限，例如把notebook存到S3，和job没有关系

**AmazonEMRStudio_ServiceRole_RandomId**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ObjectActions",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::kolmo-982397314956-datainfra-test/*"
            ],
            "Condition": {
                "StringEquals": {
                    "aws:ResourceAccount": "982397314956"
                }
            }
        },
        {
            "Sid": "BucketActions",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetEncryptionConfiguration"
            ],
            "Resource": [
                "arn:aws:s3:::kolmo-982397314956-datainfra-test"
            ],
            "Condition": {
                "StringEquals": {
                    "aws:ResourceAccount": "982397314956"
                }
            }
        }
    ]
}
```



## 创建Application

Application是配置集群和提交任务的地方，在创建Application之后，可以在这里提交任务的jar包。

workspace（AWS 托管的notebook）也是使用Application来运行

在这里可以设置：

集群使用的框架

预设容量：会带来更高的成本

最大CPU，内存，磁盘空间，注意无法指定每台机器几个CPU，多少内存，多少磁盘，一切都是AWS自动决定的

空闲时自动关闭应用等

## 创建workspace

简单而言，就是创建笔记本，创建好以后，在笔记本旁边的按钮中可以设置使用哪个集群（也就是上面提到的application），使用哪个RuntimeRole。
