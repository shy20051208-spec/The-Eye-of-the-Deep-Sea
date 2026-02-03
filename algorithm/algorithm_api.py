from fastapi import FastAPI, File, UploadFile, HTTPException
import pandas as pd
import io
import numpy as np
import logging

# 配置详细日志
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="温盐深数据分析接口", version="1.0")

# TALK插值系数
a1, b1, c1 = 2300, -10, 5  # 200-1000米
a2, b2, c2 = 2250, -8, 4   # 1000米以下

def calculate_TALK(depth, temp, sal):
    if pd.isna(depth) or pd.isna(temp) or pd.isna(sal):
        return None
    if 200 <= depth < 1000:
        return a1 + b1 * temp + c1 * sal
    elif depth >= 1000:
        return a2 + b2 * temp + c2 * sal
    else:
        return None

@app.post("/analyze", summary="温盐深数据分析与TALK插值")
async def analyze_data(file: UploadFile = File(...), limit: int = 100):
    try:
        logger.info(f"开始处理文件：{file.filename}")
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # 验证必要字段
        required_fields = ['Depthm', 'T_degC', 'Salnty']
        if not all(field in df.columns for field in required_fields):
            missing = [f for f in required_fields if f not in df.columns]
            logger.error(f"CSV缺少必要字段：{missing}")
            raise HTTPException(status_code=400, detail=f"CSV缺少必要字段：{missing}")
        
        # 计算TALK
        df['TALK_interpolated'] = df.apply(
            lambda row: calculate_TALK(row['Depthm'], row['T_degC'], row['Salnty']),
            axis=1
        )

        # 处理JSON不支持的浮点数（inf/NaN）
        df = df.replace([np.inf, -np.inf, np.nan], None)

        logger.info("处理完成，返回结果")
        return df.head(limit).to_dict(orient="records")
    
    except Exception as e:
        logger.error(f"处理请求时出错：{str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"服务端错误：{str(e)}")