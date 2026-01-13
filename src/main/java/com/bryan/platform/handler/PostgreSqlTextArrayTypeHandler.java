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

/**
 * PostgreSQL TEXT[] 类型处理器
 * 用于处理 List<String> 与 PostgreSQL TEXT[] 之间的转换
 *
 * @author Bryan Long
 */
public class PostgreSqlTextArrayTypeHandler extends BaseTypeHandler<List<String>> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType) throws SQLException {
        PGobject pgObject = new PGobject();
        pgObject.setType("text[]");
        pgObject.setValue("{" + String.join(",", parameter.stream().map(s -> "\"" + s.replace("\"", "\\\"") + "\"").toArray(String[]::new)) + "}");
        ps.setObject(i, pgObject);
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String[] array = (String[]) rs.getArray(columnName).getArray();
        return array != null ? Arrays.asList(array) : null;
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String[] array = (String[]) rs.getArray(columnIndex).getArray();
        return array != null ? Arrays.asList(array) : null;
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String[] array = (String[]) cs.getArray(columnIndex).getArray();
        return array != null ? Arrays.asList(array) : null;
    }
}