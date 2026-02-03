
import pandas as pd
import os
import numpy as np
from sklearn.linear_model import LinearRegression

# 1. 确保results文件夹存在（使用绝对路径更可靠）
results_dir = os.path.join(os.path.dirname(__file__), "C:/abyss-eye/data/results")
os.makedirs(results_dir, exist_ok=True)

# 2. 读取清洗后的数据
df = pd.read_csv("C:/abyss-eye/data/cleaned_bottle.csv")

# 3. 站点温度均值计算
area_temp_mean = df.groupby('Sta_ID')['T_degC'].mean()
print("📊 站点温度均值：\n", area_temp_mean)
area_temp_mean.to_csv(os.path.join(results_dir, "area_temp_mean.csv"))

# 4. 盐度与深度相关性分析
corr = df['Salnty'].corr(df['Depthm'])
print("🔗 盐度与深度相关性系数：", round(corr, 2))
with open(os.path.join(results_dir, "correlation_result.txt"), "w") as f:
    f.write(f"盐度与深度相关性系数：{round(corr, 2)}")

# 5. TALK分段线性插值
df_below_mixed = df[df['Depthm'] > 200]
df_200_1000 = df_below_mixed[(df_below_mixed['Depthm'] >= 200) & (df_below_mixed['Depthm'] < 1000)]
df_below_1000 = df_below_mixed[df_below_mixed['Depthm'] >= 1000]

a1, b1, c1 = 2300, -10, 5
a2, b2, c2 = 2250, -8, 4

def calculate_TALK(depth, temp, sal):
    if 200 <= depth < 1000:
        return a1 + b1 * temp + c1 * sal
    elif depth >= 1000:
        return a2 + b2 * temp + c2 * sal
    else:
        return np.nan

df['TALK_interpolated'] = df.apply(
    lambda row: calculate_TALK(row['Depthm'], row['T_degC'], row['Salnty']),
    axis=1
)

df.to_csv(os.path.join(results_dir, "TALK_interpolated.csv"), index=False)
print("✅ TALK插值完成！结果已保存为 results/TALK_interpolated.csv")
print("📊 插值后TALK值范围：", round(df['TALK_interpolated'].min(), 2), "~", round(df['TALK_interpolated'].max(), 2), "μmol/kg")

print("✅ 所有分析完成！结果已保存到 results 文件夹")
>>>>>>> 12f8e21 (完成算法开发：数据清洗+温盐深分析+TALK插值+接口封装)
