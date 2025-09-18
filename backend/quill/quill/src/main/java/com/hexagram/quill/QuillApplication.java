package com.hexagram.quill;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class QuillApplication {
	public static void main(String[] args) {
		SpringApplication.run(QuillApplication.class, args);
		System.out.println("Quill Note App Running Successfully!");
	}
}
