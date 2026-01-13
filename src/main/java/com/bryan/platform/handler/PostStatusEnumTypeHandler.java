package com.bryan.platform.handler;

import com.bryan.platform.domain.enums.post.PostStatusEnum;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * PostStatusType
 *
 * @author Bryan Long
 */
public class PostStatusEnumTypeHandler extends BaseTypeHandler<PostStatusEnum> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, PostStatusEnum parameter, JdbcType jdbcType) throws SQLException {
        // 写入数据库：枚举 -> 数字
        ps.setInt(i, parameter.getCode());
    }

    @Override
    public PostStatusEnum getNullableResult(ResultSet rs, String columnName) throws SQLException {
        // 从数据库读取：数字 -> 枚举
        int code = rs.getInt(columnName);
        if (rs.wasNull()) {
            return null;
        }
        return PostStatusEnum.of(code);
    }

    @Override
    public PostStatusEnum getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        int code = rs.getInt(columnIndex);
        if (rs.wasNull()) {
            return null;
        }
        return PostStatusEnum.of(code);
    }

    @Override
    public PostStatusEnum getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        int code = cs.getInt(columnIndex);
        if (cs.wasNull()) {
            return null;
        }
        return PostStatusEnum.of(code);
    }
}
