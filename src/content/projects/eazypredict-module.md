---
title: EazyPredict ML module
date: 2023-02-02 12:12:11 +0530
author: codevardhan
image: /images/eazypredict/featured.png
tags: [machine-learning, k-nearest-neighbours, from-scratch, python]
usemathjax: true
---

# EazyPredict - Running and comparing multiple ML models at once

Welcome to the world of 'EazyPredict', a Python module that aims to make trying out multiple prediction algorithms as simple and efficient as possible. The module was heavily influenced by the 'LazyPredict' module. I developed this module to address a few shortcomings I identified in LazyPredict.

## Why EazyPredict?

Some of its key features are as follows -

- The 'EazyPredict' module utilizes a limited number of prediction algorithms (10) in order to minimize memory usage and prevent potential issues on platforms such as Kaggle.

- Users have the option to input a custom list of prediction algorithms (as demonstrated in the example provided) in order to perform personalized comparisons with estimators of their choosing.

- The models can be saved to an output folder at the user's discretion and are returned as a dictionary, allowing for easy addition of custom hyperparameters.

- The top N models can be selected to create an ensemble using a voting classifier.

## Using it for classification

Let's try it on [this introductory problem](https://www.kaggle.com/c/titanic) on kaggle.

As written on kaggle -

> "This is the legendary Titanic ML competition – the best, first challenge for you to dive into ML competitions and familiarize yourself with how the Kaggle platform works. The competition is simple: use machine learning to create a model that predicts which passengers survived the Titanic shipwreck."

First, we need to load the dataset:

```python
df = pd.read_csv("data/train.csv")
df.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>PassengerId</th>
      <th>Survived</th>
      <th>Pclass</th>
      <th>Name</th>
      <th>Sex</th>
      <th>Age</th>
      <th>SibSp</th>
      <th>Parch</th>
      <th>Ticket</th>
      <th>Fare</th>
      <th>Cabin</th>
      <th>Embarked</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1</td>
      <td>0</td>
      <td>3</td>
      <td>Braund, Mr. Owen Harris</td>
      <td>male</td>
      <td>22.0</td>
      <td>1</td>
      <td>0</td>
      <td>A/5 21171</td>
      <td>7.2500</td>
      <td>NaN</td>
      <td>S</td>
    </tr>
    <tr>
      <th>1</th>
      <td>2</td>
      <td>1</td>
      <td>1</td>
      <td>Cumings, Mrs. John Bradley (Florence Briggs Th...</td>
      <td>female</td>
      <td>38.0</td>
      <td>1</td>
      <td>0</td>
      <td>PC 17599</td>
      <td>71.2833</td>
      <td>C85</td>
      <td>C</td>
    </tr>
    <tr>
      <th>2</th>
      <td>3</td>
      <td>1</td>
      <td>3</td>
      <td>Heikkinen, Miss. Laina</td>
      <td>female</td>
      <td>26.0</td>
      <td>0</td>
      <td>0</td>
      <td>STON/O2. 3101282</td>
      <td>7.9250</td>
      <td>NaN</td>
      <td>S</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4</td>
      <td>1</td>
      <td>1</td>
      <td>Futrelle, Mrs. Jacques Heath (Lily May Peel)</td>
      <td>female</td>
      <td>35.0</td>
      <td>1</td>
      <td>0</td>
      <td>113803</td>
      <td>53.1000</td>
      <td>C123</td>
      <td>S</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5</td>
      <td>0</td>
      <td>3</td>
      <td>Allen, Mr. William Henry</td>
      <td>male</td>
      <td>35.0</td>
      <td>0</td>
      <td>0</td>
      <td>373450</td>
      <td>8.0500</td>
      <td>NaN</td>
      <td>S</td>
    </tr>
  </tbody>
</table>
</div>

So before using eazypredict, we need to pre-process the dataset. This includes the following steps -

- Removing null values
- Encoding categorical data
- Scaling the dataset
- Splitting the training and testing data

```python
# Removes null values
df["Age"].fillna(method="bfill", inplace=True)
df["Cabin"].fillna("No Room", inplace=True)
df["Embarked"].fillna("S", inplace=True)

# Encodes categorical data
ord_enc = OrdinalEncoder()

df["Sex_code"] = ord_enc.fit_transform(df[["Sex"]])
df["Cabin_code"] = ord_enc.fit_transform(df[["Cabin"]])
df["Embarked_code"] = ord_enc.fit_transform(df[["Embarked"]])

# Selects features for X and labels for y
X_feat = [
    "Pclass",
    "Age",
    "SibSp",
    "Parch",
    "Fare",
    "Sex_code",
    "Cabin_code",
    "Embarked_code",
]
y_feat = ["Survived"]

X = df[X_feat]
y = df[y_feat]

# Scaling the features
scaler = RobustScaler()
X_norm = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

# Splitting into train, set 
X_train, X_test, y_train, y_test = train_test_split(
    X_norm, y, test_size=0.33, random_state=42
)
```
```python
X_norm.head()
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Pclass</th>
      <th>Age</th>
      <th>SibSp</th>
      <th>Parch</th>
      <th>Fare</th>
      <th>Sex_code</th>
      <th>Cabin_code</th>
      <th>Embarked_code</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>0.0</td>
      <td>-0.388889</td>
      <td>1.0</td>
      <td>0.0</td>
      <td>-0.312011</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>-2.0</td>
      <td>0.500000</td>
      <td>1.0</td>
      <td>0.0</td>
      <td>2.461242</td>
      <td>-1.0</td>
      <td>-65.0</td>
      <td>-2.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>0.0</td>
      <td>-0.166667</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>-0.282777</td>
      <td>-1.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>-2.0</td>
      <td>0.333333</td>
      <td>1.0</td>
      <td>0.0</td>
      <td>1.673732</td>
      <td>-1.0</td>
      <td>-91.0</td>
      <td>0.0</td>
    </tr>
    <tr>
      <th>4</th>
      <td>0.0</td>
      <td>0.333333</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>-0.277363</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>0.0</td>
    </tr>
  </tbody>
</table>
</div>

Now we can use eazypredict module to quicly get the predictions of the top classification algorithms.

```python
clf = EazyClassifier()
model_list, prediction_list, model_results = clf.fit(X_train, X_test, 
                                                     y_train, y_test)

model_results
```
    100%|██████████| 10/10 [00:00<00:00, 10.09it/s]





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Accuracy</th>
      <th>f1 score</th>
      <th>ROC AUC score</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>GaussianNB</th>
      <td>0.803390</td>
      <td>0.803637</td>
      <td>0.797619</td>
    </tr>
    <tr>
      <th>MLPClassifier</th>
      <td>0.803390</td>
      <td>0.800228</td>
      <td>0.784524</td>
    </tr>
    <tr>
      <th>RandomForestClassifier</th>
      <td>0.800000</td>
      <td>0.798956</td>
      <td>0.788214</td>
    </tr>
    <tr>
      <th>LGBMClassifier</th>
      <td>0.800000</td>
      <td>0.798244</td>
      <td>0.785595</td>
    </tr>
    <tr>
      <th>RidgeClassifier</th>
      <td>0.796610</td>
      <td>0.794629</td>
      <td>0.781429</td>
    </tr>
    <tr>
      <th>XGBClassifier</th>
      <td>0.779661</td>
      <td>0.779203</td>
      <td>0.769762</td>
    </tr>
    <tr>
      <th>DecisionTreeClassifier</th>
      <td>0.779661</td>
      <td>0.778869</td>
      <td>0.768452</td>
    </tr>
    <tr>
      <th>KNeighborsClassifier</th>
      <td>0.769492</td>
      <td>0.766785</td>
      <td>0.752024</td>
    </tr>
    <tr>
      <th>SVC</th>
      <td>0.688136</td>
      <td>0.662186</td>
      <td>0.640238</td>
    </tr>
    <tr>
      <th>SGDClassifier</th>
      <td>0.681356</td>
      <td>0.669167</td>
      <td>0.647619</td>
    </tr>
  </tbody>
</table>
</div>

After this you have the ability to select any model and perform hyperparameter tuning on it.

```python
gaussian_clf = model_list["GaussianNB"]

```


```python
from sklearn.model_selection import GridSearchCV

params_NB = {"var_smoothing": np.logspace(0, -9, num=100)}
gs_NB = GridSearchCV(
    estimator=gaussian_clf, param_grid=params_NB, verbose=1, scoring="accuracy"
)

gs_NB.fit(X_train, y_train.values.ravel())

gs_NB.best_params_

```

    Fitting 5 folds for each of 100 candidates, totalling 500 fits

    {'var_smoothing': 8.111308307896873e-06}



## Using it for regression

It can be used for regression in pretty much the same way as above. You just need to import the EazyRegressor estimator. 

More details can be found [here](https://github.com/codevardhan/EazyPredict/tree/main#for-regression).

## Creating an ensemble model

This is the most effective feature of this library as an ensemble model can create a really good model with minimal effort in hyper parameter tuning.

All you need to do is to pass the results and the model names from the previous "fit" step to the next one.

```python
clf = EazyClassifier()

model_list, prediction_list, model_results = clf.fit(X_train, X_test, y_train, y_test)

ensemble_reg, ensemble_results = clf.fitVotingEnsemble(model_list, model_results)
ensemble_results
```
100%|██████████| 10/10 [00:01<00:00,  6.68it/s]


<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Models</th>
      <th>Accuracy</th>
      <th>F1 score</th>
      <th>ROC AUC score</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>GaussianNB LGBMClassifier RidgeClassifier MLPC...</td>
      <td>0.816949</td>
      <td>0.758929</td>
      <td>0.799881</td>
    </tr>
  </tbody>
</table>
</div>

## Conclusion

In conclusion, 'EazyPredict' is an efficient and user-friendly Python module that makes trying out multiple prediction algorithms a breeze. Its memory-efficient design and customizable options make it a valuable tool for any data scientist or machine learning enthusiast. I hope you enjoy using 'EazyPredict' as much as I enjoyed creating it.

Check out the entire project on [Github](https://github.com/codevardhan/EazyPredict) or [PyPI](https://pypi.org/project/eazypredict/).

