---
title: The Fundamental Group
date: 2026-08-25
status: draft
math: true
---

## Motivation 

One of my biggest frustrations when taking undergrad algebra was my inability to really get a good feel for what was going on with normal subgroups. Many of the equivalent definitions like $gHg^{-1}$ felt rather arbitrary. Why are they important, and why are they all the same? What idea is it trying to get at? 

I later learned a pretty cool tool for understanding properties of groups and subgroups in my topology class, called the fundamental group. Here I hope to give a nice intuitive picture and help you understand whatever properties of groups you are curious about too!

The intended reader should have some background with groups and light familiarity with topological spaces.

## A zoo of spaces
Let's take a look at the spaces we mainly will be investigating in this post. 

- $S^1 := \{(x, y) | x^2 + y^2 = 1\}$ (Unit Circle)
- Update this as you go (Hash)

## Investigating paths in $S^1$
We want to investigate possible paths an ant can take on the circle $S^1$. Specifically, though, we care about paths where the ant ends up back home, where it started. Let us fix the ant's home at $(1, 0)$. We define a *loop* to be a continuous function $\gamma : [0, 1] \to S^1$ such that $\gamma(0) = \gamma(1) = (1, 0)$.