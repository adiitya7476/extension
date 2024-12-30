package com.TheStaffSphere;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
    	 registry.addMapping("/**")  // Apply to all endpoints
         .allowedOrigins("*") // Allow all origins (Any website)
         .allowedMethods("POST", "OPTIONS", "GET", "PUT", "DELETE") // Allow all HTTP methods
         .allowedHeaders("*");// Allow all headers
  
}
}
