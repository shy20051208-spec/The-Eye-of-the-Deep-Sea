import pandas as pd

# 1. 读取原始数据（请根据实际路径修改）
df = pd.read_csv("C:/abyss-eye/data/bottle.csv")

# 2. 清理缺失值（使用 CSV 实际字段名）
df = df.dropna(subset=['Depthm', 'T_degC', 'Salnty', 'Sta_ID'])

# 3. 统一字段格式
df['Depthm'] = df['Depthm'].astype(float)
df['T_degC'] = df['T_degC'].astype(float)
df['Salnty'] = df['Salnty'].astype(float)

# 4. 过滤异常值（IQR方法）
def remove_outliers(data, column):
    Q1 = data[column].quantile(0.25)
    Q3 = data[column].quantile(0.75)
    IQR = Q3 - Q1
    return data[(data[column] >= Q1 - 1.5 * IQR) & (data[column] <= Q3 + 1.5 * IQR)]

df = remove_outliers(df, 'T_degC')
df = remove_outliers(df, 'Salnty')

# 5. 保存清洗后的数据
df.to_csv("C:/abyss-eye/data/cleaned_bottle.csv", index=False)
print("✅ 数据清洗完成！已保存为 data/cleaned_bottle.csv")
print("📊 清洗后数据量：", len(df), "条")