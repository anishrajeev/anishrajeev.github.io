---
title: "A Survey of Stone Duality"
date: 2025-02-16T00:00:00+08:00
use_math: true
---

I am currently taking a class on categorical logic right now, and one thing that came as a surprise to me was the connection between logic, topology, and category theory. I think it forms a general topic under the name of "topos theory", but I'm not entirely sure. But something interesting we learned was about propositional logic and its connection to boolean algebras. In this post, my goal is to give a brief introduction into this connection, culminating in
Stone's representation theorem.

## Traditional Valuations
If you are familiar with propositional logic, you can skip this part. We will do a quick rundown/review. Fix some set of variables \(S\). 
We will define a formula over \(S\) inductively as 
\[
\begin{align*} 
\varphi := &p 
           &\varphi \wedge \psi\\
           &\varphi \vee \psi\\
		   &\varphi \to  \psi\\
		   &\top\\
		   &\bot\\
		   &\neg\varphi
\end{align*}
\]
We will say \(\neg\varphi\) is just shorthand for \(\varphi\to\bot\). A propositional theory is a set of variables, \(S\) and with a set of formulas \(A_{\mathbb{T}}\) that we call axioms. 
# Example
Take \(S = {p_i : i \in \mathbb{N}}\) and \(A_\mathbb{T} = p_i \vee p_j : i\neq j \in \mathbb{N}\). 

# Syntax versus Semantics
Throughout this whole post, I want to emphasize the seperation between syntax and semantics. Lets first look at syntax. Assuming that most of you are 
familiar with classical logic(Modus Ponens, Law of Explosion, Proof by Contradiction(LEM), etc.). As such, I will spare actually writing out any of the rules
because I am lazy to type up that much latex. Axioms will be things that can be proven from nothing. So, that will be the syntax interpretation of our 
theory. The semantics will also be something you have likely internalized. We call an interpretation of \(A_{\mathbb{T}}\) as a function 
\(v : S\to 2\)(i.e. assigns every variable either \(0\) or \(1\)). Then, we define the interpetation of a formula inductively, as follows
\[
\begin{align*} 
      \llbracket x \rrbracket &= v(x)\\
	  \llbracket \varphi\wedge\psi \rrbracket &= \operatorname{min}(\llbracket\varphi\rrbracket, \llbracket\psi\rrbracket)\\
	  \llbracket \varphi\vee\psi \rrbracket &= \operatorname{max}(\llbracket\varphi\rrbracket, \llbracket\psi\rrbracket)\\
	  \llbracket \varphi\to\psi \rrbracket &= \llbracket\varphi\rrbracket \leq \llbracket\psi\rrbracket\\
	  \llbracket \top \rrbracket &= 1\\
	  \llbracket \bot \rrbracket &= 0\\
\end{align*}
\]
 
