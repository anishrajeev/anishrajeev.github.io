---
title: Covering Spaces
date: 2026-08-25
status: unlisted
math: true
---

## Motivation 

One of my biggest frustrations when taking undergrad algebra was my inability to really get a good feel for what was going on with various different properties of subgroups. For example, take normal subgroups. Many of the equivalent definitions felt rather arbitrary, specifically how were they pinning down the same idea? Why are they important, and why are they all the same? What idea is it trying to get at? 

I later learned a pretty cool tool for understanding properties of groups and subgroups in my topology class, called the fundamental group. Here I hope to give a nice intuitive picture and help you understand a lot of properties of groups you are curious about too!

The idea is that if we have some space $X$ that has fundamental group $G$, then looking at a subgroup $H$ of $G$ with some special property $P$, we also have a space (called a "covering space of $X$") $Y$ "representing" $H$, for which we can prove that some nice property $P'$ holds on $Y$ if and only if $P$ holds for $H$.

The intended reader should have some background with groups and light familiarity with topological spaces.

## What this post aims to cover

This is the first part of a two part series, where in this post I am mainly aiming to build up the machinery. This means homotopies, the fundamental group, covering spaces, and the classification theorem.

The next post will ideally get to apply this machinery to visualize a bunch of different properties!

## The fundamental group

In this section, we are going to build the machinery to get a group out of a space

#### **Investigating paths in $S^1$**
There was a lot of vocab in quotation in the motivation section. The main thing that is unclear, as of now, is how do we even get a group out of a space? The canonical introduction to seeing what is happening is looking at $S^1$, which is just the unit circle. Imagine you are an ant who lives on $S^1$, and your home is at $(1, 0)$. You spend everyday just walking around $S^1$. We call one of these walks a path, which is defined as a continuous map $\gamma : [0, 1] \to S^1$. Since you, the ant, start at home, we also place the restriction that $\gamma(0) = (1, 0)$. From now on let us just call $[0, 1]$ as $I$. So, a walk is a function from $I$ to $S^1$. Let's introduce a new restriction, though, that you like to be home by the end of the day. So, this would correspond to $\gamma(0) = \gamma(1) = (1, 0)$. There is a lot of possible loops on $S^1$! We want to ideally group loops that are "basically" the same, so we don't carry a bunch of reduntant info in our group. I can kind of deform a loop that goes counterclockwise around the circle to $(1, 0)$ and back into a loop that goes counterclockwise around the circle to $(0.9, 0.435)$ and back. We can view a "deformation" as just slowly changing the original path into the new path. How do we rigorously define this deformation idea? 
#### **Homotopies**
We will now take a small detour and work with an arbitrary space, $X$, for the purpose of building the machinery in generality. First, this means we define a "loop" to be with respect to some "basepoint". What this means is that on some space $X$, a loop, $\gamma$ is just a continuous map from $I \to X$ with $\gamma(0) = \gamma(1)$, which is what we call the basepoint. Let's think about some properties that we would want our deformation to have. Well for starters, we can only deform one path, $\gamma_0$, into another, $\gamma_1$, if they have the same endpoints (i.e. $\gamma_0(0) = \gamma_1(0)$ and $\gamma_0(1) = \gamma_1(1)$). Next, as we deform the old path into the new path, we want to ensure every intermediate path is still a path from the original start point to the original end point. Additionally, we would like this deformation to be "continuous" over paths, whatever that may mean, as it would seem rather trivial if we let our deformations just skip over "features" of a space. So, using these criteria, we can define a homotopy rigorously. Given two paths, $\gamma_0, \gamma_1: I \to X$ with the same start and end  points, we say a homotopy is a function $H : I \times I \to X$ such that 

- for all $t \in I$, $H(t, 0) = \gamma_0(0)$
- for all $t \in I$, $H(t, 1) = \gamma_0(1)$
- for all $s \in I$, $H(0, s) = \gamma_0(s)$
- for all $s \in I$, $H(1, s) = \gamma_1(s)$
- $H$ is continuous 

You can view the first argument to $H$ as specifying a *path* in the deformation, and the second as specifying a point on our path. The reason we have the first and second conditions is so that we can make sure our homotopy really says something about our paths $\gamma_0, \gamma_1$. 

Let's bring this back to loops now; fix a basepoint $x_0$. It turns out that all loops at this basepoint have the same start and endpoints! So, we can in fact treat the existence of a homotopy between two loops as a binary relation $\gamma_0 \sim \gamma_1$. As it turns out, this is actually an equivalence relation! 

- Reflexivity
   #proof-hidden 
   Take some loop $\gamma$. We want to show $\gamma \sim \gamma$. We can just use $H(t, s) = \gamma(t)$.
   #end-proof
- Symmetry
   #proof-hidden 
   Take some loops $\gamma_0, \gamma_1$ with the same start and end points. Also assume that $\gamma_0 \sim \gamma_1$ by the homotopy $H$. We want to build $H'$ that shows $\gamma_1 \sim \gamma_0$. Just take $H'(t, s) = H(1 - t, s)$.
   #end-proof
- Transitivity 
   #proof-hidden
   Take three paths $\gamma_0, \gamma_1, \gamma_2$ with all the same start and end points. We have $\gamma_0 \sim \gamma_1$ by $H_0$ and $\gamma_1 \sim \gamma_2$ by $H_1$. We need $\gamma_0 \sim \gamma_2$. Define 
   $$
   H_2(t, s)=
   \begin{cases}
   H_0(t, s), & 0 \leq t_0 \leq \frac{1}{2}, \\
   H_1(2t - 1, s), & \frac{1}{2} < t \leq 1.
   \end{cases}
   $$
   #end-proof

#### **The fundamental group**

So, what I hope I've convinced you of is that under the lens of homotopy, we carry a lot of "reduntant" information around in the set of all loops in a space at a given basepoint! What I'm trying to hint towards is maybe we can quotient out by this reduntant information since it is an equivalence relation, and maybe a nice future group operation that respects the equivalence classes will fall out!

Let the set $G = \{[\gamma] : \gamma \text{ is a loop at } x_0\}$ (the aformentioned quotiented out set). The obvious first candidate for a nice operation to multiply two elements of $G$ is just loop concatenation (we already saw this in the proof of transitivity). So, given two loops $\gamma_0, \gamma_1$ with the same basepoint, we can get a loop $\gamma_2$ with the same basepoint by defining
$\gamma_2(s) = 
\begin{cases}
\gamma_0(2s), & 0 \leq s \leq \frac{1}{2} \\
\gamma_1(2s - 1), & \frac{1}{2} \leq s \leq 1
\end{cases}$

Great! Call this operation $\star$. The most important thing we have to prove now is that $\star$ respects $\sim$.
#proof-hidden Construction
Let $\gamma_0, \gamma_1, \gamma_2, \gamma_3$ be loops at $x_0$ with $\gamma_0 \sim \gamma_1$ and $\gamma_2 \sim \gamma_3$ witnessed by homotopies $H_0, H_1$. We have to show that 
$\gamma_0 \star \gamma_1 \sim \gamma_2 \star \gamma_3$.
Let us create the homotopy $H_2$ as follows.
$H_2(s, t) := 
\begin{cases}
H_0(s, t), & 0 \lt s \le \frac{1}{2} \\
H_1(s, t), & \frac{1}{2} \lt s \le 1
\end{cases}$
Basically, all we are doing is if we are still in position less than equal to $\frac{1}{2}$, then we are still doing the first loop, so we look at its homotopy, otherwise we look at the second loops homotopy.
#end-proof
The proof that this construction works, along with the other properties of the group, are left as an exercise to the reader.

To finally put a name to this group, define
$$ 
   \pi_1(X, x_0) := \{[\gamma] : \gamma \text{ is a loop at } x_0\}
$$
with
$$ 
   [\gamma_0] \cdot [\gamma_1] := [\gamma_0 \star \gamma_1]
$$

This is called the fundamental group

#### **Back to $S^1$**
We return to $S^1$ with some tools to analyze what the actual *distinct* loops on $S^1$ look like. How do we even go about calculating $\pi_1(S^1, (1, 0))$? Well, let us first look at it intuitively. 

## FIX THIS; FIRST ESTABLISH THE TRIVIALNESS OF NON SMOOTH PATHS
Let us first establish that any backtracking doesn't matter. If the ant travels 

If I gave you one loop, $\gamma_0(s) := (1, 0)$, where the ant stays at $(1, 0)$ all day, and another, $\gamma_1(s) := (\cos(2\pi s), \sin(2\pi s))$, where the ant does a smooth counter-clockwise walk on $S^1$, the intuition should ideally be that $\gamma_0 \nsim \gamma_1$. There seems to be something (namely the giant hole in the center) obstructing the ability for $\gamma_1$ to move *continuously* into $\gamma_0$!
The same thing applies for $\gamma_2 := (\cos(4\pi s), \sin(4\pi s))$. It seems like there is no way that $\gamma_2 \sim \gamma_1$. So, as a first guess, we should guess that for any given 
