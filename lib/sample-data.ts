import { Assignment } from './types';

export const sampleAssignments: Assignment[] = [
  {
    id: 'sample-edu-1',
    title: 'Educational Psychology Mid-Term',
    subject: 'Educational Psychology',
    totalMarks: 40,
    maxAiContentPercent: 20,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'q1',
        prompt: 'Explain Vygotsky\'s Zone of Proximal Development (ZPD) and discuss how teachers can apply this concept in a primary school classroom.',
        maxMarks: 15,
        markingGuide: `- Clear definition of ZPD (4 marks)
- Explanation of scaffolding concept (3 marks)
- At least two practical classroom applications (5 marks)
- Examples from Zimbabwean/African context (3 marks)`
      },
      {
        id: 'q2',
        prompt: 'Compare and contrast Piaget\'s and Bruner\'s theories of cognitive development. Which theory do you think is more applicable to teaching Grade 3 learners? Justify your answer.',
        maxMarks: 25,
        markingGuide: `- Accurate description of Piaget's stages (5 marks)
- Accurate description of Bruner's spiral curriculum (5 marks)
- Identification of similarities (3 marks)
- Identification of differences (4 marks)
- Clear position with justification (5 marks)
- Reference to Grade 3 developmental characteristics (3 marks)`
      }
    ]
  },
  {
    id: 'sample-agric-1',
    title: 'Sustainable Agriculture Practices',
    subject: 'Agriculture Science',
    totalMarks: 30,
    maxAiContentPercent: 25,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: 'q1',
        prompt: 'Describe THREE sustainable farming practices suitable for smallholder farmers in Zimbabwe. For each practice, explain its environmental benefits and potential challenges.',
        maxMarks: 18,
        markingGuide: `For each of three practices (6 marks each):
- Clear description of the practice (2 marks)
- Environmental benefits explained (2 marks)
- Practical challenges identified (2 marks)
Examples may include: crop rotation, conservation tillage, agroforestry, composting, integrated pest management`
      },
      {
        id: 'q2',
        prompt: 'Explain the importance of soil pH in crop production and describe how farmers can manage soil acidity.',
        maxMarks: 12,
        markingGuide: `- Definition and significance of soil pH (3 marks)
- Effects of pH on nutrient availability (3 marks)
- Methods to correct soil acidity (4 marks)
- Practical application advice (2 marks)`
      }
    ]
  }
];

export const sampleAnswers = {
  'sample-edu-1': [
    {
      studentName: 'Tendai Moyo',
      answers: [
        {
          questionId: 'q1',
          text: `The Zone of Proximal Development (ZPD) is a concept developed by Lev Vygotsky that refers to the difference between what a learner can do independently and what they can achieve with guidance from a more knowledgeable other. This "zone" represents the sweet spot where learning occurs most effectively.

In the classroom, teachers can apply ZPD through scaffolding - providing temporary support that is gradually removed as students become more competent. For example, when teaching reading in a Grade 2 class at Madziwa, a teacher might initially read a story aloud, then read together with students (choral reading), then have students read in pairs, and finally have them read independently.

Another application is peer tutoring, where stronger students help those who are struggling. I observed this during teaching practice where students worked in mixed-ability groups to solve mathematics problems. The more capable students naturally scaffolded their peers' learning.

Teachers can also use think-alouds to demonstrate problem-solving strategies, making their thinking visible to students. This helps students understand the cognitive processes involved in tasks that are currently beyond their independent capability.`
        },
        {
          questionId: 'q2',
          text: `Piaget's theory emphasizes stages of cognitive development: sensorimotor, preoperational, concrete operational, and formal operational. He believed children move through these stages in a fixed sequence, with cognitive development driven by maturation and active exploration. At each stage, children think qualitatively differently.

Bruner, on the other hand, proposed a spiral curriculum where concepts are revisited at increasing levels of complexity. He identified three modes of representation: enactive (action-based), iconic (image-based), and symbolic (language-based). Unlike Piaget, Bruner believed any subject could be taught at any age if presented appropriately.

Similarities include both theorists emphasizing active learning and the importance of concrete experiences. Both recognize that children construct their own understanding.

Key differences: Piaget saw development as stage-bound and age-related, while Bruner saw it as more flexible. Piaget focused on what children cannot do at certain ages, while Bruner emphasized how to make content accessible through appropriate representation.

For Grade 3 learners (typically ages 8-9), I believe Bruner's theory is more applicable. Grade 3 students are in Piaget's concrete operational stage, but Bruner's approach allows teachers more flexibility. In my teaching practice, I successfully taught about Zimbabwean history by first using drama (enactive), then pictures and maps (iconic), then written descriptions (symbolic). This spiral approach worked better than waiting for students to "be ready" as Piaget might suggest.

Bruner's emphasis on scaffolding and the social aspects of learning also aligns well with Zimbabwean cultural values of community and cooperative learning. His theory empowers teachers to be more proactive in supporting learning rather than simply waiting for developmental readiness.`
        }
      ]
    },
    {
      studentName: 'Grace Chikwamba',
      answers: [
        {
          questionId: 'q1',
          text: `The Zone of Proximal Development represents the gap between what students can do alone versus with help. Vygotsky emphasized that learning occurs in this zone through social interaction and guidance.

Teachers apply ZPD by providing appropriate challenges - not too easy (already mastered) and not too hard (beyond reach even with help). They use scaffolding techniques like modeling, giving hints, breaking tasks into steps, and providing feedback.

In classroom practice, this might involve group work where students learn from each other, or using teaching assistants to provide extra support. The key is knowing each student's current level and providing the right amount of support.`
        },
        {
          questionId: 'q2',
          text: `Both Piaget and Bruner are cognitive development theorists who believe children actively construct knowledge. Piaget identified four stages of development that children progress through based on age. Each stage has specific characteristics and ways of thinking.

Bruner developed the idea of spiral curriculum and three modes of learning - doing things, using pictures, and using words/symbols. He thought you could teach anything to anyone if you present it the right way.

They are similar in believing children learn by doing and need hands-on experiences. They differ because Piaget focuses on stages and ages while Bruner is more flexible about when children can learn things.

For Grade 3, I think both have value but Bruner is more practical. His idea that we can teach complex ideas in simple ways is helpful for planning lessons. Piaget helps us understand what Grade 3 students can generally do, but Bruner gives us strategies to push learning forward.`
        }
      ]
    }
  ],
  'sample-agric-1': [
    {
      studentName: 'Kudzai Ncube',
      answers: [
        {
          questionId: 'q1',
          text: `Three sustainable farming practices suitable for Zimbabwean smallholder farmers:

1. Crop Rotation and Intercropping
Crop rotation involves growing different crops in sequence on the same land. For example, alternating maize with legumes like groundnuts or beans. Intercropping means growing two or more crops together, such as maize with cowpeas.

Environmental benefits: This practice improves soil fertility naturally because legumes fix nitrogen from the air. It also breaks pest and disease cycles, reduces soil erosion, and increases biodiversity. Mixed cropping creates a more resilient farm ecosystem.

Challenges: Requires knowledge of which crops work well together. Some farmers worry about competition between crops for nutrients and water. Marketing mixed harvests can be more difficult than single crops. Initial planning and management is more complex than monoculture.

2. Conservation Tillage with Mulching
This practice involves minimum soil disturbance and keeping crop residues on the field as mulch. Instead of ploughing the entire field, farmers make small planting basins or rip lines only where seeds will be planted.

Environmental benefits: Mulch protects soil from erosion by wind and water, retains soil moisture, suppresses weeds, and adds organic matter as it decomposes. This method significantly reduces soil degradation and improves water infiltration. Carbon is kept in the soil rather than released through oxidation during ploughing.

Challenges: Requires a change in mindset from traditional ploughing methods. Initial labor for basin digging can be high. Some farmers face pressure to use crop residues for livestock feed rather than mulch. Termites can be problematic in some areas. Weed management requires more attention in the first years.

3. Agroforestry Systems
Integrating trees with crops and/or livestock. Examples include planting Faidherbia albida trees in fields, using nitrogen-fixing trees as live fences, or establishing woodlots alongside fields.

Environmental benefits: Trees fix nitrogen, provide mulch from leaf drop, reduce wind erosion, create habitats for beneficial insects and birds, sequester carbon, and improve microclimates. Deep tree roots bring up nutrients from subsoil and improve soil structure. Trees also provide additional products like fruit, fodder, and firewood.

Challenges: Trees take time to establish and show benefits - requiring patience and long-term planning. Competition for light, water, and nutrients if not properly managed. Some tree species can harbor pests. Land tenure insecurity may discourage tree planting if farmers don't feel secure about long-term land access.`
        },
        {
          questionId: 'q2',
          text: `Soil pH measures the acidity or alkalinity of soil on a scale from 0 to 14, with 7 being neutral, below 7 acidic, and above 7 alkaline. pH is crucial in crop production because it affects nutrient availability and microbial activity.

Most crops grow best in slightly acidic to neutral soils (pH 6.0-7.0). In this range, essential nutrients like nitrogen, phosphorus, and potassium are most available to plants. When soil becomes too acidic (below pH 5.5), aluminum and manganese can reach toxic levels while calcium, magnesium, and phosphorus become less available. This leads to poor crop growth, reduced yields, and nutrient deficiencies.

Many Zimbabwean soils, especially in high rainfall areas, tend toward acidity due to leaching of basic cations and use of acidifying fertilizers like ammonium-based products.

Farmers can manage soil acidity through:

1. Liming - applying agricultural lime (calcium carbonate) or dolomitic lime (which also provides magnesium). The amount needed depends on soil pH test results and soil type. Generally, 1-3 tonnes per hectare may be required. Lime should be applied during land preparation and mixed into the topsoil. Effects last 2-4 years depending on rainfall and farming practices.

2. Using organic matter - adding compost or manure gradually increases pH and improves soil buffering capacity. Organic matter helps soil resist pH changes.

3. Choosing appropriate crops - some crops tolerate acidity better than others. For example, tea and potatoes can grow in acidic soils, while tobacco and most vegetables prefer neutral pH.

4. Reducing acidifying inputs - rotating or reducing use of acidifying fertilizers like ammonium sulfate, and using more neutral options when possible.

Practical application: Farmers should test their soil pH every 2-3 years. Simple pH test kits are available through Agritex offices. Based on results, they can plan liming applications well before planting season since lime takes time to react with soil. For smallholders, starting with a small test plot is advisable to see results before treating entire fields.`
        }
      ]
    }
  ]
};
