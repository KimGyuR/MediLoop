package com.mediloop.backend.dto;

public record HospitalCardResponse(
    String name,
    String meta,
    String tone,
    String address,
    String hours,
    String phone,
    String distance,
    String directionQuery,
    String reserveQuery) {
}
