---
title: A Few Things I've Learnt from Popular Statistics Books
description: Why statistical thinking is fundamentally about embracing uncertainty, not eliminating it.
date_created: 2026-04-05
date_updated: 2026-04-12
competencies:
- Statistics
aliases: []
---

Over the past few years I've read a shelf of popular statistics books. I'm not sure how many I'd need to read to get over my statistics imposter syndrome.

This post highlights that **statistical thinking is fundamentally about decision-making under uncertainty**. The value of statistics isn't in the numbers themselves, but in how they shape our choices.

**Statistics requires simplification**. Whether you're building a predictive model or calculating an average, you're throwing away information to make the problem tractable. That tractability however is what is needed for statistics to drive decision making.

**What follows are a few insights from some of the popular statistics books I've read over the years**. Each section covers a single book, organised around a central idea that has changed how I think about data, decisions, and the gap between models and reality.

The approximate order is by increasing technical depth, starting with the societal implications of models and ending with the mathematical principles underlying statistical thinking.

## Weapons of Math Destruction

*Cathy O'Neil*

### The Limits of Predictive Modelling

> No model can include all of the real world's complexity or the nuance of human communication. Inevitably, some important information gets left out.

Predictive modelling (or any kind of modelling) always requires losing or abstracting away details of the real world.

> Our own values and desires influence our choices, from the data we choose to collect to the questions we ask. Models are opinions embedded in mathematics.

The bias of predictive models comes from data and the choices made by the statistical modeller.

### Flywheels

> This creates a pernicious feedback loop. The policing itself spawns new data, which justifies more policing.

Prediction models can create feedback loops, where the predictions made by a model influence the data used to validate and train future models.

## The Signal and the Noise

*Nate Silver*

### Bias, Variance and Capacity

Predictive modelling aims to find signal amongst noise:

> The goal of any predictive model is to capture as much signal as possible and as little noise as possible.

The balance between these two creates the balance between bias, variance and model capacity.

A high capacity model is a complicated model, which will overfit to the training data:

> Needlessly complicated models may fit the noise in a problem rather than the signal, doing a poor job of replicating its underlying structure and causing predictions to be worse.

One approach to reducing bias is through diversity - different models can capture different parts of the signal:

> It's critical to have a diversity of models.

### Probability is about Decision Making

The true value of probabilistic thinking is to improve your own thinking:

> The virtue in thinking probabilistically is that you will force yourself to stop and smell the data-slow down, and consider the imperfections in your thinking. Over time, you should find that this makes your decision making better.

## Naked Statistics

*Charles Wheelan*

### Statistics is about simplifying the world

> Descriptive statistics exist to simplify, which always implies some loss of nuance or detail. Anyone working with numbers needs to recognize as much.

The value of simplification is that we can understand the world. The cost of this simplification is a loss of detail.

## Calling Bullshit

*Carl T. Bergstrom & Jevin D. West*

### Brandolini's principle

Part of the struggle of the rational, statistical person is Brandolini's principle:

> Perhaps the most important principle in bullshit studies is Brandolini's principle. Coined by Italian software engineer Alberto Brandolini in 2014, it states: "The amount of energy needed to refute bullshit is an order of magnitude bigger than that needed to produce it."

### Data Quality

Data is king - the quality of the data is the most important factor in any analysis:

> If the data that go into the analysis are flawed, the specific technical details of the analysis don't matter.

> Begin with bad data and labels, and you'll get a bad program that makes bad predictions in return.

### Types of Probability

There are three useful types of probability:

- **Marginal probability**: $P(A)$ — the probability of $A$ occurring
- **Conditional probability**: $P(B|A)$ — the probability of $B$ occurring given $A$ has occurred
- **Joint probability**: $P(A,B)$ — the probability of $A$ and $B$ occurring together

> There is a key distinction between a probabilistic cause (A increases the chance of B in a causal manner), a sufficient cause (if A happens, B always happens), and a necessary cause (unless A happens, B can't happen).

Translating these into probability statements:

- **Probabilistic cause**: $A$ raises the chance of $B$, or $P(B|A) > P(B)$
- **Sufficient cause**: $A$ guarantees $B$, or $P(B|A) = 1$
- **Necessary cause**: $B$ cannot occur without $A$, or $P(B|A^c) = 0$ ($A^c$ is the complement of $A$)

## The Flaw of Averages

*Sam L. Savage*

### Average Abuse

> Plans based on average assumptions are wrong on average.

The average is the most commonly used statistic, so is also the most commonly abused.

> To understand how pervasive the Flaw of Averages is, consider the hypothetical case of a marketing manager who has just been asked by his boss to forecast demand for a new-generation microchip. "That's difficult for a new product," responds the manager, "but I'm confident that annual demand will be between 50,000 and 150,000 units." "Give me a number to take to my production people," barks the boss. "I can't tell them to build a production line with a capacity between 50,000 and 150,000 units!" The phrase "Give me a number" is a dependable leading indicator of an encounter with the Flaw of Averages, but the marketing manager dutifully replies: "If you need a single number, I suggest you use the average of 100,000." The boss plugs the average demand, along with the cost of a 100,000-unit capacity production line, into a spreadsheet model of the business. The bottom line is a healthy \\$10 million, which he reports as the projected profit. Assuming that demand is the only uncertainty and that 100,000 is the correct average (or expected) demand, then \\$10 million must be the average (or expected) profit. Right? Wrong! The Flaw of Averages ensures that on average, profit will be less than the profit associated with the average demand. Why? If the actual demand is only 90,000, the boss won't make the projection of \\$10 million. If demand is 80,000, the results will be even worse. That's the downside. On the other hand, what if demand is 110,000 or 120,000? Then you exceed your capacity and can still sell only 100,000 units. So profit is capped at \\$10 million. There is no upside to balance the downside, as shown in Figure 1.1, which helps explain why, on average, everything is below projection.

### Statistics is about Decisions

Statistics is about decisions - any piece of work done should always be pointing towards influencing how a decision is made:

> So what's a fair price for a piece of information? Here's a clue. If it cannot impact a decision, it's worthless.

### Simpson's Paradox

> Simpson's Paradox occurs when the variables depend on hidden dimensions in the data.

Simpson's paradox is a phenomenon in statistics where a signal appears when data is aggregated, but disappears when the data is disaggregated. The classic example of Simpsons paradox is a study on gender bias in university admissions.

Data aggregated across all departments showed a bias against women, but when the data was disaggregated, the data showed that while four departments were biased against women, six were biased against men.  The bias against women detected in the aggregated data occurred due to women being more likely to apply to more competitive departments.

In the case of the quote above, the hidden dimension is the department the students applied to.

## Fooled by Randomness

*Nassim Nicholas Taleb*

### Profiting off Variance

> Mild success can be explainable by skills and labor. Wild success is attributable to variance.

There is a lot of noise in high performance outcomes, and it's easy to attribute that performance to skill when it is due to luck.

> Accordingly, it is not how likely an event is to happen that matters, it is how much is made when it happens that should be the consideration.

Lessons from first year engineering - `risk = hazard * probability`.

### The Danger of Data

> A small knowledge of probability can lead to worse results than no knowledge at all.

> The problem with information is not that it is diverting and generally useless, but that it is toxic.

> The problem is that, without a proper method, empirical observations can lead you astray.

> It is a mistake to use, as journalists and some economists do, statistics without logic, but the reverse does not hold: It is not a mistake to use logic without statistics).

Data driven (inductive) thinking is not the only way - deductive thinking from principles and assumptions is important as well.

## Statistics Done Wrong

*Alex Reinhart*

> Much of basic statistics is not intuitive (or, at least, not taught in an intuitive fashion), and the opportunity for misunderstanding and error is massive.

Statistics is certainly unintuitive, but with enough work (learning from the past) it can become obvious.

> Surveys of statistically significant results reported in medical and psychological trials suggest that many p values are wrong and some statistically insignificant results are actually significant when computed correctly.
>
> Even the prestigious journal Nature isn't perfect, with roughly 38% of papers making typos and calculation errors in their p values. Other reviews find examples of misclassified data, erroneous duplication of data, inclusion of the wrong dataset entirely, and other mix-ups, all concealed by papers that did not describe their analysis in enough detail for the errors to be easily noticed.

An almost 40% error rate of using p-values in one of the world's top academic journals maybe suggests it's not a good way to determine statistical significance.

### Importance of Sharing Data

> Next Wicherts and his colleagues looked for a correlation between these errors and an unwillingness to share data. There was a clear relationship. 
>
> Authors who refused to share their data were more likely to have committed an error in their paper, and their statistical evidence tended to be weaker. Because most authors refused to share their data, Wicherts could not dig for deeper statistical errors, and many more may be lurking.

One principle I have of data systems is reproducibility - for example with machine learning, that it's possible to easily reproduce a model or any predictions it makes.

This reproducibility is a kind of sharing data - it's sharing with your future self.

## Map and Territory

*Eliezer Yudkowsky*

### Biased Sampling

> When your method of learning about the world is biased, learning more may not help. Acquiring more data can even consistently worsen a biased prediction.

When starting out learning machine learning, I only appreciated that model predictive performance scaled with data. In reality, sometimes more data is bad.

### Proportion Dominance Effect

> A proposed health program to save the lives of Rwandan refugees garnered far higher support when it promised to save 4,500 lives in a camp of 11,000 refugees, rather than 4,500 in a camp of 250,000.

**Context changes how numbers are interpreted.** Presenting and converting absolute and relative measures is a key skill of working with data.

### Cognitive versus Statistical Biases

> A cognitive bias is a systematic error in how we think, as opposed to a random error or one that's merely caused by our ignorance. Whereas statistical bias skews a sample so that it less closely resembles a larger population, cognitive biases skew our thinking so that it less accurately tracks the truth (or less reliably serves our other goals).

## How Not to Be Wrong

*Jordan Ellenberg*

### Solve Easy Problems

> A basic rule of mathematical life: if the universe hands you a hard problem, try to solve an easier one instead, and hope the simple version is close enough to the original problem that the universe doesn't object.

An example of this from my career is using linear models to approximate engineering relationships that are non-linear (such as the relationship between efficiency and load on a gas turbine).

### Non-Linearity

> Nonlinear thinking means which way you should go depends on where you already are.

Non-linearity is closely related to state - the state of the system is important.  How variables change depends on where you are. With linear relationships, the state of the system is irrelevant.

### Improbable Things Happen A Lot

> The universe is big, and if you're sufficiently attuned to amazingly improbable occurrences, you'll find them. Improbable things happen a lot.

This is Littlewood's Law - that a person can expect to experience events with odds of one in a million at the rate of about one per month.

Learning to expect that unexpected things happen a lot is one of my most treasured lessons from statistics.

## Summary

**Statistics is not about certainty—it's about making better decisions when certainty is impossible.**

Every author here converges on this point, whether discussing predictive models, p-values, or the dangers of averages. The goal is never perfect knowledge. It's clearer thinking about uncertainty, and the humility to recognise when your model has simplified away something important.

The best statistical thinking is **sceptical without being cynical**, quantitative without being numerically naive. Every summary statistic embeds a value judgment about what matters. In a world increasingly run by algorithms and awash in data, these lessons aren't just useful—they're essential.

The **Popular Statistics Books Reading List** is:

- [**Weapons of Math Destruction**](https://www.amazon.com/Weapons-Math-Destruction-Increases-Inequality/dp/0553418815)  
  *Cathy O'Neil* — the limits of predictive modelling and destructive feedback loops
- [**The Signal and the Noise**](https://www.amazon.com/Signal-Noise-Many-Predictions-Fail/dp/0143125087)  
  *Nate Silver* — bias, variance, and probabilistic decision making
- [**Naked Statistics**](https://www.amazon.com/Naked-Statistics-Stripping-Dread-Data/dp/039334777X)  
  *Charles Wheelan* — statistics as simplification
- [**Calling Bullshit**](https://www.amazon.com/Calling-Bullshit-Sophistry-Data-Science/dp/0525509186)  
  *Carl T. Bergstrom & Jevin D. West* — Brandolini's principle and data quality
- [**The Flaw of Averages**](https://www.amazon.com/Flaw-Averages-Underestimate-Risk-Inevitably/dp/1118073754)  
  *Sam L. Savage* — the abuse of averages and decision-focused statistics
- [**Fooled by Randomness**](https://www.amazon.com/Fooled-Randomness-Hidden-Markets-Incerto/dp/1400067936)  
  *Nassim Nicholas Taleb* — variance, survivorship bias, and the dangers of data
- [**Statistics Done Wrong**](https://www.amazon.com/Statistics-Done-Wrong-Analysis-Scientist/dp/1593276206)  
  *Alex Reinhart* — p-value problems and the importance of sharing data
- [**Map and Territory**](https://www.amazon.com/Map-Territory-Rationality-Sequence-ebook/dp/B07LDF7J3Q)  
  *Eliezer Yudkowsky* — cognitive versus statistical biases
- [**How Not to Be Wrong**](https://www.amazon.com/How-Not-Be-Wrong-Mathematical/dp/0143127535)  
  *Jordan Ellenberg* — mathematical thinking and improbable events

Thanks for reading!
