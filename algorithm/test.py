
import pandas as pd
import numpy as np

df = pd.read_csv('../data/xxx.csv')

missing_values = df.isnull().sum()
print("缺失值统计：\n", missing_values)

Q1 = df['temperature'].quantile(0.25)
Q3 = df['temperature'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

outliers = df[(df['temperature'] < lower_bound) | (df['temperature'] > upper_bound)]
print("温度异常值数量：", len(outliers))