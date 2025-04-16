
1. 池化

降采样用的


目标是：收集每家上市公司在每个年度的数据，包括：**所有由种子词汇衍生出的词汇的词频总数，外购的数据资产词频数，自行开发的数据资产词频数**


## convert_to_tensor

```python
embeddings = model.encode(sentences, convert_to_tensor=True)
print(type(embeddings))
# 输出：<class 'torch.Tensor'>
```


```python
import torch
similarity = torch.nn.functional.cosine_similarity(embeddings[0], embeddings[1], dim=0)

```