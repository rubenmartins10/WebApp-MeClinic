-- Round all fractional stock values to nearest integer
UPDATE produtos SET stock_atual = ROUND(stock_atual), stock_minimo = ROUND(stock_minimo);
