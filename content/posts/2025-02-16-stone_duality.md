---
title: "A Survey of Stone Duality"
date: 2025-02-16T00:00:00+08:00
[params]
  math = true
---

I am currently taking a class on categorical logic right now, and one thing that came as a surprise to me was the connection between logic, topology, and category theory. I think it forms a general topic under the name of "topos theory", but I'm not entirely sure. But something interesting we learned was about propositional logic and its connection to boolean algebras. In this post, my goal is to give a brief introduction into this connection, culminating in
Stone's representation theorem.

## Traditional Valuations
If you are familiar with propositional logic, you can skip this part. For a quick rundown/review, remember that a term in propositional logic is defined
inductively as 
\[
\begin{align*} 
\varphi \coloneq &\varphi \wedge \psi\\
                 &\varphi \vee \psi\\
				 &\varphi \to  \psi\\
				 &\top\\
				 &\bot\\
				 &\neg\varphi
\end{align*}
\]
This is an inline \(a^*=x-b^*\) equation.
Inline math: {{< texi `\varphi` >}}

Displayed math: 
{{< texd `\begin{aligned}
\varphi &\Rightarrow \psi \\
\varnothing &\rightarrow A
\end{aligned}` >}}
