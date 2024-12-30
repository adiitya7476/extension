package com.TheStaffSphere.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mfd")
public class WebElementController {

    private static final Logger logger = LoggerFactory.getLogger(WebElementController.class);

    @CrossOrigin(origins = "*")  // Temporarily allow all origins for testing (this is redundant if you have global CORS)
    @PostMapping("/getXpath")
    public void handleElementClick(@RequestBody ElementData elementData) {
    	System.out.println("Element Name: " + elementData.getElementName());
    	System.out.println("Element XPath: " + elementData.getElementXPath());
        try {
            // Log incoming data
            logger.info("Element Name: " + elementData.getElementName());
            logger.info("Element XPath: " + elementData.getElementXPath());

            // Process the data (you can add further processing or DB operations here)
        } catch (Exception e) {
            logger.error("Error handling element data", e);
            throw new RuntimeException("Error processing the element data");
        }
    }

    // Inner class to represent the data structure of the incoming request
    public static class ElementData {
        private String elementName;
        private String elementXPath;

        // Getters and setters
        public String getElementName() {
            return elementName;
        }

        public void setElementName(String elementName) {
            this.elementName = elementName;
        }

        public String getElementXPath() {
            return elementXPath;
        }

        public void setElementXPath(String elementXPath) {
            this.elementXPath = elementXPath;
        }
    }
}
