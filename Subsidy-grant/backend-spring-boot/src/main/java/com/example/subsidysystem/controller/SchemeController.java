package com.example.subsidysystem.controller;

import com.example.subsidysystem.entity.Scheme;
import com.example.subsidysystem.repository.SchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/schemes")
@CrossOrigin(origins = "*")
public class SchemeController {

    private final SchemeRepository schemeRepository;

    public SchemeController(SchemeRepository schemeRepository) {
        this.schemeRepository = schemeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Scheme>> getAllSchemes() {
        return ResponseEntity.ok(schemeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Scheme> getSchemeById(@PathVariable String id) {
        return schemeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Scheme> createScheme(@RequestBody Scheme scheme) {
        Scheme saved = schemeRepository.save(scheme);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }
}
