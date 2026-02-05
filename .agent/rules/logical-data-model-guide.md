---
trigger: always_on
---

# 論理データモデルの記述仕様書 (YAML形式)

論理データモデルを定義する際は、以下のYAMLフォーマットを厳守してください。

## 概要

## 1. ファイル構造

```yaml
schema_version: "1.0"
model_name: "ModelName"
description: "モデルの説明"
entities:
  EntityName: # PascalCase (例: UserProfile)
    description: "エンティティの説明"
    attributes:
      attribute_name: # snake_case (例: user_id)
        # ...属性定義
    relationships:
      relationship_name: # snake_case (例: has_orders)
        # ...リレーション定義

```

## 2. 属性 (Attribute) 定義

各属性には以下のフィールドを設定してください。

* `type`: データ型。以下のいずれかを選択。
* `String`: 短い文字列
* `Text`: 長文・説明文
* `Integer`: 整数
* `Float`: 浮動小数点数
* `Date`: 日付
* `Boolean`: 真偽値
* `Enum`: 列挙型（`options`リストが必須）
* `description`: 項目の意味定義。
* `required`: `true` の場合、必須項目。
* `primary_key`: `true` の場合、主キー。
* `note`: 補足事項（任意）。

## 3. リレーション (Relationship) 定義

エンティティ間の関係を定義します。

* `target`: 相手方のエンティティ名。
* `description`: 関係性の説明。
* `cardinality`: ソースからターゲットへの多重度。
* `1:1`: 必須の1対1
* `1:N`: 必須の1対多
* `0:1`: 任意の1対1（ゼロまたは1）
* `0:N`: 任意の1対多（ゼロまたは多）

## 記述例

```yaml
schema_version: "1.0"
model_name: "ProjectDataManagementPlan_LogicalModel"
description: "ProjectDataManagementPlanの論理データモデル"
entities:
  Contributor:
    description: "プロジェクトへの貢献者の情報"
    attributes:
      contributor_id:
        type: "String"
        description: "メンバーID"
        primary_key: true
      name:
        type: "String"
        description: "氏名"
        required: true
      affiliation_and_title:
        type: "String"
        description: "所属・役職"
      role_in_project:
        type: "Enum"
        description: "プロジェクト内の役割"
        options:
          - "Project Leader (プロジェクトリーダー)"
          - "Project Member (プロジェクトメンバー)"
          - "Data Collector (データセットの取得者又は収集者)"
          - "Data Manager (データセットの管理責任者)"
  Dataset:
    description: "データセットの情報"
    attributes:
      dataset_id:
        type: "String"
        description: "データセットID"
        primary_key: true
      name:
        type: "String"
        description: "データセット名"
        required: true
      access_type:
        type: "Enum"
        description: "公開設定"
        options: ["Public", "Private"]
    relationships:
      collected_by:
        target: "Contributor"
        description: "データセットの取得者又は収集者"
        cardinality: "1:1"
      managed_by:
        target: "Contributor"
        description: "データセットの管理責任者"
        cardinality: "0:1"

```
