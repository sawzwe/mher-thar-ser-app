import { describe, it, expect } from "vitest";
import { haversineDistance, formatDistance } from "@/lib/geo";

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    const p = { lat: 13.7563, lng: 100.5018 };
    expect(haversineDistance(p, p)).toBe(0);
  });

  it("computes correct distance between two Bangkok locations", () => {
    // Siam BTS to Phrom Phong BTS ≈ 3.2 km
    const siam = { lat: 13.7454, lng: 100.5345 };
    const phromPhong = { lat: 13.7301, lng: 100.5698 };
    const dist = haversineDistance(siam, phromPhong);
    expect(dist).toBeGreaterThan(3);
    expect(dist).toBeLessThan(5);
  });

  it("computes correct distance across longer range", () => {
    // Bangkok to Chiang Mai ≈ 585 km
    const bangkok = { lat: 13.7563, lng: 100.5018 };
    const chiangMai = { lat: 18.7883, lng: 98.9853 };
    const dist = haversineDistance(bangkok, chiangMai);
    expect(dist).toBeGreaterThan(550);
    expect(dist).toBeLessThan(620);
  });

  it("is symmetric", () => {
    const a = { lat: 13.7454, lng: 100.5345 };
    const b = { lat: 13.7301, lng: 100.5698 };
    const d1 = haversineDistance(a, b);
    const d2 = haversineDistance(b, a);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.0001);
  });
});

describe("formatDistance", () => {
  it("formats distance < 1km in meters", () => {
    expect(formatDistance(0.5)).toBe("500 m");
    expect(formatDistance(0.123)).toBe("123 m");
  });

  it("formats distance >= 1km in km", () => {
    expect(formatDistance(2.345)).toBe("2.3 km");
    expect(formatDistance(10)).toBe("10.0 km");
  });
});
