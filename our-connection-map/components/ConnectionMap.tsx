
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { User, Connection } from '../types';

interface Props {
  users: User[];
  connections: Connection[];
}

const ConnectionMap: React.FC<Props> = ({ users, connections }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 100;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Filters for glow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const gLinks = svg.append('g').attr('class', 'links');
    const gNodes = svg.append('g').attr('class', 'nodes');
    const gLabels = svg.append('g').attr('class', 'labels');

    const simulation = d3.forceSimulation<any>(users)
      .force('link', d3.forceLink<any, any>(connections).id(d => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(90));

    // Links
    const link = gLinks.selectAll('path')
      .data(connections)
      .enter().append('path')
      .attr('fill', 'none')
      .attr('stroke', '#ff9f40')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '8,4');

    // Link Labels
    const linkLabels = gLabels.selectAll('g')
      .data(connections)
      .enter().append('g')
      .attr('class', 'pointer-events-none');

    linkLabels.append('rect')
      .attr('fill', 'white')
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('height', 22)
      .attr('opacity', 0.9);

    linkLabels.append('text')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#e63946')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text(d => d.commonTraits.slice(0, 2).map(t => '#' + t).join(' '));

    // Nodes
    const node = gNodes.selectAll('g')
      .data(users)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // 색상 결정 함수: 특징 10개 완료 여부와 매칭 상태에 따라
    const getNodeColor = (d: any) => {
      if (d.currentMatchId) return '#ff6b6b'; // 대화 중 - 빨간색
      const traitsCount = d.traits?.length || 0;
      if (traitsCount === 10) return '#10b981'; // 특징 완료 - 초록색
      return '#9ca3af'; // 미완료 - 회색
    };

    // Circle Node
    node.append('circle')
      .attr('r', 40)
      .attr('fill', 'white')
      .attr('stroke', d => getNodeColor(d))
      .attr('stroke-width', 4)
      .attr('style', 'filter: url(#glow)')
      .attr('class', d => d.currentMatchId ? 'animate-pulse' : '');

    // User Icon
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '24px')
      .attr('fill', d => getNodeColor(d))
      .text('\uf007');

    // Name
    node.append('text')
      .attr('y', 60)
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        const traitsCount = d.traits?.length || 0;
        if (d.currentMatchId) return '#ff6b6b'; // 대화 중 - 빨간색
        if (traitsCount === 10) return '#10b981'; // 특징 완료 - 초록색
        return '#9ca3af'; // 미완료 - 회색
      })
      .attr('font-weight', '900')
      .attr('font-size', '13px')
      .text(d => d.name);

    // Dept
    node.append('text')
      .attr('y', 76)
      .attr('text-anchor', 'middle')
      .attr('fill', '#998d8d')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.department);

    simulation.on('tick', () => {
      link.attr('d', d => {
        const dx = (d.target as any).x - (d.source as any).x;
        const dy = (d.target as any).y - (d.source as any).y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${(d.source as any).x},${(d.source as any).y}A${dr},${dr} 0 0,1 ${(d.target as any).x},${(d.target as any).y}`;
      });

      linkLabels.attr('transform', d => {
        const x = ((d.source as any).x + (d.target as any).x) / 2;
        const y = ((d.source as any).y + (d.target as any).y) / 2;
        return `translate(${x},${y})`;
      });

      linkLabels.each(function(d) {
          const g = d3.select(this);
          const text = g.select('text').node() as SVGTextElement;
          const bbox = text.getBBox();
          g.select('rect')
            .attr('x', bbox.x - 8)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 16);
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [users, connections]);

  return <svg ref={svgRef} className="w-full h-full" />;
};

export default ConnectionMap;
