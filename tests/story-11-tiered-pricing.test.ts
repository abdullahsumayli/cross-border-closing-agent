// Story 11 [@Phase2]: التسعير الطبقي + Freemium
// Plan limits + enforcement + conversion are pure → fully unit-tested. The upgrade
// route + usage guards are thin glue over these functions.

import {
  PLANS,
  PLAN_TIERS,
  getPlan,
  canAddProperty,
  canQualifyLead,
  canDistributeTo,
  planLimitsPayload,
  isConversion,
} from '../src/lib/plans'

describe('Story 11 [@Phase2] — tiered pricing + freemium', () => {
  // ─── AC-11.1: free plan ─────────────────────────────────────────────────────
  it('AC-11.1 a free plan exists with real limits and zero price @AC-11.1', () => {
    expect(PLAN_TIERS).toEqual(['free', 'starter', 'pro', 'agency'])
    expect(getPlan('free').priceSar).toBe(0)
    expect(getPlan('free').maxProperties).toBeGreaterThan(0)
    expect(getPlan('free').maxQualifiedLeads).toBeGreaterThan(0)
  })

  // ─── AC-11.3: programmatic limit enforcement ────────────────────────────────
  it('AC-11.3 blocks adding a property once the plan cap is reached @AC-11.3', () => {
    expect(canAddProperty({ properties: 0 }, 'free')).toBe(true)
    expect(canAddProperty({ properties: PLANS.free.maxProperties }, 'free')).toBe(false)
    expect(canAddProperty({ properties: 9 }, 'starter')).toBe(true)
    expect(canAddProperty({ properties: 10 }, 'starter')).toBe(false)
  })

  it('AC-11.3 blocks qualifying a lead past the cap @AC-11.3', () => {
    expect(canQualifyLead({ qualifiedLeads: 4 }, 'free')).toBe(true)
    expect(canQualifyLead({ qualifiedLeads: 5 }, 'free')).toBe(false)
  })

  it('AC-11.3 caps the number of distribution channels per plan @AC-11.3', () => {
    expect(canDistributeTo(1, 'free')).toBe(true)
    expect(canDistributeTo(2, 'free')).toBe(false)
    expect(canDistributeTo(3, 'starter')).toBe(true)
    expect(canDistributeTo(4, 'starter')).toBe(false)
  })

  it('AC-11.3 agency tier is unlimited (-1) on every axis @AC-11.3', () => {
    expect(canAddProperty({ properties: 9999 }, 'agency')).toBe(true)
    expect(canQualifyLead({ qualifiedLeads: 9999 }, 'agency')).toBe(true)
    expect(canDistributeTo(9999, 'agency')).toBe(true)
  })

  // ─── AC-11.2: instant upgrade updates limits ────────────────────────────────
  it('AC-11.2 planLimitsPayload writes the new tier limits to apply instantly @AC-11.2', () => {
    const payload = planLimitsPayload('pro')
    expect(payload.tier).toBe('pro')
    expect(payload.price_sar).toBe(PLANS.pro.priceSar)
    expect(payload.max_properties).toBe(PLANS.pro.maxProperties)
    expect(payload.max_channels).toBe(PLANS.pro.maxChannels)
    expect(payload.max_qualified_leads).toBe(PLANS.pro.maxQualifiedLeads)
  })

  // ─── AC-11.4: conversion tracking ───────────────────────────────────────────
  it('AC-11.4 free → paid counts as a conversion; other moves do not @AC-11.4', () => {
    expect(isConversion('free', 'pro')).toBe(true)
    expect(isConversion('free', 'starter')).toBe(true)
    expect(isConversion('free', 'free')).toBe(false)
    expect(isConversion('starter', 'pro')).toBe(false) // upgrade, not first conversion
  })
})
