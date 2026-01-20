package com.bryan.platform.config;

import com.bryan.platform.handler.MyBatisAuditFieldInterceptor;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * MyBatisPlusConfig
 *
 * @author Bryan Long
 */
@Configuration
@MapperScan("com.bryan.platform.mapper")
@EnableTransactionManagement
public class MyBatisConfig {

    @Bean
    public MyBatisAuditFieldInterceptor auditFieldInterceptor() {
        return new MyBatisAuditFieldInterceptor();
    }
}
