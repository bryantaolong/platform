package com.bryan.platform.handler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.postgresql.util.PGobject;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PostgreSQL TEXT[] 数组类型处理器
 * 实现 List<String> 与数据库 text[] 之间的双向映射，支持特殊字符转义。
 *
 * @author Bryan Long
 */
public class PostgreSqlTextArrayTypeHandler extends BaseTypeHandler<List<String>> {

    /**
     * 将 Java List<String> 写入 PreparedStatement
     *
     * @param ps        预编译语句
     * @param i         参数下标
     * @param parameter 字符串列表
     * @param jdbcType  JDBC 类型（可空）
     * @throws SQLException 数据库访问异常
     */
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType) throws SQLException {
        PGobject pgObject = new PGobject();
        pgObject.setType("text[]");
        // 拼接 PostgreSQL 数组字面量，例如 {"a","b"}
        String arrayLiteral = "{" +
                parameter.stream()
                        .map(s -> "\"" + s.replace("\"", "\\\"") + "\"")
                        .collect(Collectors.joining(",")) +
                "}";
        pgObject.setValue(arrayLiteral);
        ps.setObject(i, pgObject);
    }

    /**
     * 根据列名读取 text[] 并转换为 List<String>
     *
     * @param rs         结果集
     * @param columnName 列名
     * @return 字符串列表；若数据库值为 null 则返回 null
     * @throws SQLException 数据库访问异常
     */
    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        java.sql.Array sqlArray = rs.getArray(columnName);
        if (sqlArray == null) {
            return null;
        }
        String[] array = (String[]) sqlArray.getArray();
        return Arrays.asList(array);
    }

    /**
     * 根据列下标读取 text[] 并转换为 List<String>
     *
     * @param rs          结果集
     * @param columnIndex 列下标（从 1 开始）
     * @return 字符串列表；若数据库值为 null 则返回 null
     * @throws SQLException 数据库访问异常
     */
    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        java.sql.Array sqlArray = rs.getArray(columnIndex);
        if (sqlArray == null) {
            return null;
        }
        String[] array = (String[]) sqlArray.getArray();
        return Arrays.asList(array);
    }

    /**
     * 从存储过程结果中读取 text[] 并转换为 List<String>
     *
     * @param cs          调用语句
     * @param columnIndex 列下标（从 1 开始）
     * @return 字符串列表；若数据库值为 null 则返回 null
     * @throws SQLException 数据库访问异常
     */
    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        java.sql.Array sqlArray = cs.getArray(columnIndex);
        if (sqlArray == null) {
            return null;
        }
        String[] array = (String[]) sqlArray.getArray();
        return Arrays.asList(array);
    }
}
