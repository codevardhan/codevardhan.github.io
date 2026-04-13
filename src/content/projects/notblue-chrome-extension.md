---
title: Chrome Extension To Monitor Mental Health
date: 2021-05-31 10:10:11 +0530
image: /images/not_blue/not_blue_post.png
author: codevardhan
tags: [machine-learning, natural-language-processing, deep-learning, chrome-extension]
---

# Chrome Extension To Monitor Mental Health


### Introduction

This project was a really interesting one that I was fortunate enough to be a part of! We made as an entry project to compete in a hackathon organised by HackOn. We did not win the hackathon, but we did create a unique and interesting project. (imo)

Our project aims to monitor a user's search patterns and use this information to inform their close/loved ones about potential mental health problems the user might be facing. A recent study showed that most people who are mentally depressed in some form have used the internet in a manner that has worsened their illness. So our goal with this approach is to help in the monitoring of ‘at-risk’ individuals and prevent them from becoming their own worst enemy.

We aim to achieve this goal through a chrome extension that tracks the search phrases entered by the user and sends them to a deep learning model, that determines whether the user shows signs of depression or not!

### Thought Process Behind the Project

The motivation behind this project is highly personal. We all have a friend who had to go through some dark times in some periods of their lives. Some were able to overcome this, while some were not so fortunate. One thing that we all can agree on is that there are not many support systems that help or support people in such cases. Our extension is aimed to help not only the fighters but also their supporters who want to help more. We know someone who went through such a phase, and something that was missing was a medium to alert close ones when to intervene, as you can never expect someone to know everything you are going through.

### Making the machine learning model

I was in charge of making the machine learning model that would be used by us for the web extension. I used common NLP methods such as preprocessing, tokenizing, encoding. The pre-processing was done by making a function of its own.

#### Dataset

We used two different datasets for this model. The problem is a classification question that has to decide whether a person is depressed (true state) or not depressed (false state). I used 2 datasets to train the true and false state.

The first [dataset](https://www.kaggle.com/nikhileswarkomati/suicide-watch) is from kaggle. It is a collection of posts from "SuicideWatch" and "depression" subreddits of the Reddit platform. The posts are collected using Pushshift API. All posts that were made to "SuicideWatch" from Dec 16, 2008 (creation) till Jan 2, 2021, were collected while "depression" posts were collected from Jan 1, 2009, to Jan 2, 2021. We took the posts that were written by people suffering from depression as the true state.

The second [dataset](https://www.kaggle.com/kazanova/sentiment140) is a sentiment analysis dataset. It contains 1,600,000 tweets extracted using the twitter API. The tweets have been annotated (0 = negative, 2 = neutral, 4 = positive) and they can be used to detect sentiment. We took the dataset that includes neutral and positive flags.

I did it this way because the 'negative' statements from the twitter sentiment analysis dataset might be some tweet regarding a hate crime, or an angry tweet. It does not necessarily have to be the words of a person undergoing depression. So I overcame this with the Reddit dataset. Going through the subreddit mentioned, it was clear that most of the posts were regarding depression/existential crisis. Any post swaying from these topics would be quickly taken down by the moderators. So, this was most accurate data we would get that could be used to emulate the psyche of a depressed person.

#### Pre-proccessing-

```python

TEXT_CLEANING_RE = "@\S+|https?:\S+|http?:\S|[^A-Za-z0-9]+"

def preprocess(text, stem=False):
    # Remove link,user and special characters
    text = re.sub(TEXT_CLEANING_RE, ' ', str(text).lower()).strip()
    tokens = []
    for token in text.split():
        if token not in stop_words:
            if stem:
                tokens.append(stemmer.stem(token))
            else:
                tokens.append(token)
    return " ".join(tokens)

```

I used packages from word2vec and keras text pre-processing for building the vocabulary and tokenizing the data respectively.

#### Building vocabulary -

```python
W2V_SIZE = 300
W2V_WINDOW = 7
W2V_EPOCH = 32
W2V_MIN_COUNT = 10

KERAS_MODEL = "model.h5"
WORD2VEC_MODEL = "model.w2v"
TOKENIZER_MODEL = "tokenizer.pkl"
ENCODER_MODEL = "encoder.pkl"

w2v_model = gensim.models.word2vec.Word2Vec(size=W2V_SIZE,
                                            window=W2V_WINDOW,
                                            min_count=W2V_MIN_COUNT,
                                            workers=8)

w2v_model.build_vocab(documents)
w2v_model.train(documents, total_examples=len(documents), epochs=W2V_EPOCH)

```

#### Tokenizing -

```python
tokenizer = Tokenizer()
tokenizer.fit_on_texts(df_train.text)
vocab_size = len(tokenizer.word_index) + 1
print("Total words", vocab_size)
```

Then I used LabelEncoder() from sklearn to encode the tokenized text data.

#### Encoding -

```python
encoder = LabelEncoder()
encoder.fit(df_train.target.tolist())

y_train = encoder.transform(df_train.target.tolist())
y_test = encoder.transform(df_test.target.tolist())

y_train = y_train.reshape(-1,1)
y_test = y_test.reshape(-1,1)
```

#### Making the model

We defined the neural network as follow and trained it for about 10 epochs. This resulted in an accuracy of 96%.

```python
model = Sequential()
model.add(embedding_layer)
model.add(Dropout(0.5))
model.add(LSTM(100, dropout=0.2, recurrent_dropout=0.2))
model.add(Dense(1, activation='sigmoid'))
model.summary()
model.compile(loss='binary_crossentropy',
            optimizer="adam",
            metrics=['accuracy'])
```

![plot of training and validation accuracy](/images/not_blue/model_training.png)

After the training is done, we can predict if a phrase shows signs of depression or not, in the following way -

```python
predict("painless way to die", model1)

{'elapsed_time': 0.1011207103729248,
 'label': True,
 'score': 0.8831092119216919}
```

### Making the chrome extension

I was not involved very heavily in this part, but what we did was to design a front end that takes in a users email ID, name and multiple friend's email IDs.
The extension is built using javascript and closely interacts with Chrome extensions API. This makes it possible to run on any chromium based browser such as
opera, edge, etc. The extension gets the search query and sends it as a JSON structure to our API endpoint /predict. This endpoint is where our DL model is hosted.
The DL model takes the string as an input and returns a score (from 0-1 ). The higher the score is, the more likely the person is to be depressed. This extension runs
in the background and updates a score variable based on the averages of multiple search results. If the score variable crosses a particular threshold, an email will be sent
to the close ones of the user.

That was the method we used to implement this project :). Link to the GitHub repo can be found [here.](https://github.com/codevardhan/not-blue-hackon/)
